// pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

// Instancia o Prisma com logging detalhado
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
      console.log('[CHECKOUT API][GET] where filter:', where)

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
      console.log(`[CHECKOUT API][GET] encontrou ${checkouts.length} registros`)
      return res.status(200).json(checkouts)
    }

    // ============================= POST ===================================
    if (req.method === 'POST') {
      console.log('[CHECKOUT API][POST] Body recebido:', req.body)
      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      // Validação
      if (
        !checkinId ||
        !dataSaidaReal ||
        typeof formaPagamento !== 'string' ||
        typeof total !== 'number'
      ) {
        console.error('[CHECKOUT API][POST] Campos inválidos:', req.body)
        return res
          .status(400)
          .json({ error: 'Campos obrigatórios faltando ou inválidos.' })
      }

      // 1) Cria o checkout
      console.log('[CHECKOUT API][POST] criando CheckOut...')
      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId),
          dataSaidaReal: asMidnight(dataSaidaReal) ?? new Date(),
          formaPagamento,
          total: Number(total),
        },
      })
      console.log('[CHECKOUT API][POST] CheckOut criado:', novoCheckout)

      // 2) Busca dados do CheckIn para usar nos faturamentos
      console.log(
        `[CHECKOUT API][POST] buscando CheckIn ${checkinId} para dados do faturamento`
      )
      const checkinInfo = await prisma.checkIn.findUnique({
        where: { id: Number(checkinId) },
      })
      console.log('[CHECKOUT API][POST] CheckIn info:', checkinInfo)

      // 3) Marca consumos como pagos e cria faturamento de comanda_hospede
      console.log(
        `[CHECKOUT API][POST] buscando consumos para checkin ${checkinId}...`
      )
      const consumos = await prisma.consumo.findMany({
        where: { checkinId: Number(checkinId) },
      })
      console.log(
        `[CHECKOUT API][POST] achou ${consumos.length} consumos para checkin ${checkinId}`
      )

      for (const consumo of consumos) {
        console.log(
          `[CHECKOUT API][POST] processando consumo ${consumo.id} (status: ${consumo.status})`
        )
        let subcomandas: any[] = []

        // Tenta parsear subcomandas
        try {
          if (Array.isArray(consumo.subcomandas)) {
            subcomandas = consumo.subcomandas
          } else if (typeof consumo.subcomandas === 'string') {
            subcomandas = JSON.parse(consumo.subcomandas) as any[]
          }
        } catch (err) {
          console.error(
            `[CHECKOUT API][POST] erro ao parsear subcomandas do consumo ${consumo.id}:`,
            err
          )
        }

        // Marca todos os itens como pagos
        subcomandas = subcomandas.map((sub: any) => ({
          ...sub,
          itens: (sub.itens || []).map((item: any) => ({
            ...item,
            pago: true,
          })),
        }))

        // Atualiza o consumo para "pago"
        console.log(
          `[CHECKOUT API][POST] atualizando consumo ${consumo.id} para 'pago'`,
          { subcomandas }
        )
        await prisma.consumo.update({
          where: { id: consumo.id },
          data: {
            subcomandas: subcomandas as Prisma.JsonArray,
            status: 'pago',
            updatedAt: new Date(),
          },
        })
        console.log(
          `[CHECKOUT API][POST] consumo ${consumo.id} atualizado com sucesso`
        )

        // Calcula total da comanda
        const totalComanda = subcomandas.reduce(
          (sum, sub) => sum + (sub.total || 0),
          0
        )
        console.log(
          `[CHECKOUT API][POST] totalComanda para consumo ${consumo.id}:`,
          totalComanda
        )

        // Cria faturamento do tipo "comanda_hospede"
        // Observação: cast para InputJsonValue para satisfazer o TS
        const ftComanda = await prisma.faturamento.create({
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
        console.log(
          `[CHECKOUT API][POST] faturamento COMANDA_HOSPEDE criado:`,
          ftComanda
        )
      }

      // 4) Atualiza status do CheckIn para "finalizado"
      console.log(
        `[CHECKOUT API][POST] atualizando CheckIn ${checkinId} para 'finalizado'`
      )
      const updatedCheckin = await prisma.checkIn.update({
        where: { id: Number(checkinId) },
        data: { status: 'finalizado' },
      })
      console.log('[CHECKOUT API][POST] CheckIn atualizado:', updatedCheckin)

      // 5) Cria faturamento do tipo "hospedagem"
      console.log('[CHECKOUT API][POST] criando Faturamento HOSPEDAGEM...')
      try {
        const ftHospedagem = await prisma.faturamento.create({
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
        console.log(
          '[CHECKOUT API][POST] faturamento HOSPEDAGEM criado com sucesso:',
          ftHospedagem
        )
      } catch (fErr) {
        console.error(
          '[CHECKOUT API][POST] falha ao criar faturamento HOSPEDAGEM:',
          fErr
        )
      }

      return res.status(201).json(novoCheckout)
    }

    // ========================= MÉTODO NÃO SUPORTADO ========================
    console.warn('[CHECKOUT API] Método não suportado:', req.method)
    res.setHeader('Allow', ['GET', 'POST'])
    return res
      .status(405)
      .json({ error: `Método ${req.method} não suportado.` })
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
