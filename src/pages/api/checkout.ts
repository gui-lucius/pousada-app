// pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Helper para garantir "YYYY-MM-DDT00:00:00.000Z"
function asMidnight(dateStr: string) {
  if (!dateStr) return undefined
  return new Date(dateStr.slice(0, 10) + 'T00:00:00.000Z')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[CHECKOUT API] ➡️  ${req.method} ${req.url}`)

  try {
    // ============================= GET ===================================
    if (req.method === 'GET') {
      console.log('[CHECKOUT API][GET] Query params:', req.query)
      const { inicio, fim } = req.query
      const where: any = {}

      if (inicio && fim) {
        where.dataSaidaReal = {
          gte: asMidnight(inicio as string),
          lte: asMidnight(fim as string),
        }
      }

      const checkouts = await prisma.checkOut.findMany({
        where,
        orderBy: { dataSaidaReal: 'desc' },
        include: {
          checkin: {
            select: {
              id: true,
              nome: true,
              chale: true,
              valor: true,
              entrada: true,
              saida: true,
              consumos: {
                select: {
                  id: true,
                  status: true,
                  criadoEm: true,
                  updatedAt: true,
                  subcomandas: true,
                },
              },
            },
          },
        },
      })
      return res.status(200).json(checkouts)
    }

    // ============================= POST ===================================
    if (req.method === 'POST') {
      console.log('[CHECKOUT API][POST] Body recebido:', req.body)
      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      if (!checkinId || !dataSaidaReal || typeof formaPagamento !== 'string' || typeof total !== 'number') {
        return res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' })
      }

      // 1) Cria o checkout
      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId),
          dataSaidaReal: asMidnight(dataSaidaReal) ?? new Date(),
          formaPagamento,
          total: Number(total),
        },
      })

      // 2) Busca dados do CheckIn para usar nos faturamentos
      const checkinInfo = await prisma.checkIn.findUnique({
        where: { id: Number(checkinId) },
      })

      // 3) Marca consumos como pagos e cria faturamento de comanda_hospede (se não existir)
      const consumos = await prisma.consumo.findMany({
        where: { checkinId: Number(checkinId) },
      })

      for (const consumo of consumos) {
        let subcomandas: any[] = []

        try {
          if (Array.isArray(consumo.subcomandas)) {
            subcomandas = consumo.subcomandas
          } else if (typeof consumo.subcomandas === 'string') {
            subcomandas = JSON.parse(consumo.subcomandas) as any[]
          }
        } catch (err) {
          console.error(`[CHECKOUT API] Erro ao parsear subcomandas do consumo ${consumo.id}:`, err)
        }

        subcomandas = subcomandas.map((sub: any) => ({
          ...sub,
          itens: (sub.itens || []).map((item: any) => ({
            ...item,
            pago: true,
          })),
        }))

        await prisma.consumo.update({
          where: { id: consumo.id },
          data: {
            subcomandas: subcomandas as Prisma.JsonArray,
            status: 'pago',
            updatedAt: new Date(),
          },
        })

        const totalComanda = subcomandas.reduce((sum, sub) => sum + (sub.total || 0), 0)

        // 🔹 Verifica se já existe faturamento dessa comanda_hospede
        const jaExiste = await prisma.faturamento.findFirst({
          where: {
            referenciaId: consumo.id,
            tipo: 'comanda_hospede',
          },
        })
        if (jaExiste) {
          console.log(`[CHECKOUT API] faturamento COMANDA_HOSPEDE já existe para consumo ${consumo.id}, pulando criação`)
          continue
        }

        await prisma.faturamento.create({
          data: {
            tipo: 'comanda_hospede',
            referenciaId: consumo.id,
            checkinId: Number(checkinId),
            nomeHospede: consumo.cliente,
            chale: checkinInfo?.chale ?? '',
            dataEntrada: checkinInfo?.entrada ?? undefined,
            dataSaida: checkinInfo?.saida ?? undefined,
            dataSaidaReal: asMidnight(dataSaidaReal) ?? new Date(),
            valorComanda: totalComanda,
            total: totalComanda,
            formaPagamento,
            itensComanda: subcomandas as unknown as Prisma.InputJsonValue,
            criadoEm: new Date(),
          },
        })
      }

      // 4) Atualiza status do CheckIn para "finalizado"
      await prisma.checkIn.update({
        where: { id: Number(checkinId) },
        data: { status: 'finalizado' },
      })

      // 5) Cria faturamento do tipo "hospedagem" (se não existir)
      const jaExisteHosp = await prisma.faturamento.findFirst({
        where: {
          checkinId: Number(checkinId),
          tipo: 'hospedagem',
        },
      })
      if (!jaExisteHosp) {
        await prisma.faturamento.create({
          data: {
            tipo: 'hospedagem',
            referenciaId: novoCheckout.id,
            checkinId: Number(checkinId),
            nomeHospede: checkinInfo?.nome ?? '',
            chale: checkinInfo?.chale ?? '',
            dataEntrada: checkinInfo?.entrada ?? undefined,
            dataSaida: checkinInfo?.saida ?? undefined,
            dataSaidaReal: asMidnight(dataSaidaReal) ?? new Date(),
            valorHospedagem: Number(total),
            formaPagamento,
            criadoEm: new Date(),
          },
        })
      } else {
        console.log(`[CHECKOUT API] faturamento HOSPEDAGEM já existe para checkin ${checkinId}, pulando criação`)
      }

      return res.status(201).json(novoCheckout)
    }

    // ========================= MÉTODO NÃO SUPORTADO ========================
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Método ${req.method} não suportado.` })
  } catch (error: any) {
    console.error('[CHECKOUT API][ERRO]:', error)
    return res.status(500).json({ error: error.message || 'Erro interno' })
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect()
    }
    console.log('[CHECKOUT API] ✅ Request finalizada')
  }
}
