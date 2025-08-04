// pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log(`[CHECKOUT API] Nova request: ${req.method}`);

    if (req.method === 'GET') {
      // Pega filtros de data no formato ISO vindo do frontend
      const { inicio, fim } = req.query

      let where: any = {}
      if (inicio && fim) {
        where.dataSaidaReal = {
          gte: new Date(inicio as string), // Exemplo: "2025-08-03T00:00:00.000Z"
          lte: new Date(fim as string),    // Exemplo: "2025-08-04T23:59:59.999Z"
        }
      }

      // Debug para ver exatamente o filtro do banco
      console.log('[CHECKOUT API][GET] Filtros:', where)

      const checkouts = await prisma.checkOut.findMany({
        where,
        orderBy: { dataSaidaReal: 'desc' },
        include: {
          checkin: {
            select: {
              id: true,
              chale: true,
              valor: true,
              entrada: true,
              saida: true,
              nome: true,
              consumos: {
                select: {
                  id: true,
                  status: true,
                  criadoEm: true,
                  updatedAt: true,
                  subcomandas: true,
                }
              }
            }
          }
        }
      })

      console.log(`[CHECKOUT API][GET] Encontrou: ${checkouts.length} registros`)
      return res.status(200).json(checkouts)
    }

    if (req.method === 'POST') {
      console.log(`[CHECKOUT API][POST] Body recebido:`, req.body);

      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      if (
        !checkinId ||
        !dataSaidaReal ||
        typeof formaPagamento !== 'string' ||
        typeof total !== 'number'
      ) {
        console.error('[CHECKOUT API][POST] Campos obrigatórios faltando ou inválidos.', req.body)
        res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' })
        return
      }

      // Cria o checkout
      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId),
          dataSaidaReal: new Date(dataSaidaReal),
          formaPagamento,
          total: Number(total),
        },
      })
      console.log(`[CHECKOUT API][POST] Novo checkout criado:`, novoCheckout);

      // Busca e marca todos os consumos desse checkin como pagos
      const consumos = await prisma.consumo.findMany({
        where: { checkinId: Number(checkinId) }
      })
      console.log(`[CHECKOUT API][POST] Achou ${consumos.length} consumos para checkin ${checkinId}`);

      for (const consumo of consumos) {
        let subcomandas: any[] = []
        try {
          if (Array.isArray(consumo.subcomandas)) {
            subcomandas = consumo.subcomandas
          } else if (typeof consumo.subcomandas === "string") {
            subcomandas = JSON.parse(consumo.subcomandas)
            if (!Array.isArray(subcomandas)) subcomandas = []
          } else if (consumo.subcomandas && typeof consumo.subcomandas === "object") {
            subcomandas = []
          } else {
            subcomandas = []
          }
        } catch (err) {
          console.error(`[CHECKOUT API][POST] Erro ao parsear subcomandas do consumo ${consumo.id}:`, err)
          subcomandas = []
        }

        subcomandas = subcomandas.map((sub: any) => ({
          ...sub,
          itens: (sub.itens || []).map((item: any) => ({
            ...item,
            pago: true
          }))
        }))

        await prisma.consumo.update({
          where: { id: consumo.id },
          data: { subcomandas: subcomandas as Prisma.JsonArray, status: 'pago' }
        })
        console.log(`[CHECKOUT API][POST] Consumo ${consumo.id} atualizado para "pago"`)
      }

      res.status(201).json(novoCheckout)
      return
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Método ${req.method} não suportado.` })
    return
  } catch (error: any) {
    console.error(`[CHECKOUT API][ERRO]:`, error)
    res.status(500).json({ error: error.message || 'Erro interno do servidor' })
    return
  } finally {
    // Só desconecta em produção!
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect()
    }
  }
}
