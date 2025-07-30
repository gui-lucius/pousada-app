import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

// GET /api/checkout?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
// POST /api/checkout

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: listar todos ou filtrar por data
    if (req.method === 'GET') {
      const { inicio, fim } = req.query

      let where = {}
      if (inicio && fim) {
        where = {
          dataSaidaReal: {
            gte: new Date(inicio as string),
            lte: new Date(fim as string)
          }
        }
      }

      const checkouts = await prisma.checkOut.findMany({
        where,
        orderBy: { dataSaidaReal: 'desc' }
      })

      return res.status(200).json(checkouts)
    }

    // POST: criar novo checkout
    if (req.method === 'POST') {
      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      if (!checkinId || !dataSaidaReal || !formaPagamento || !total) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
      }

      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId), // Se for Int no schema.prisma
          dataSaidaReal: new Date(dataSaidaReal),
          formaPagamento,
          total: Number(total)
        }
      })

      return res.status(201).json(novoCheckout)
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
