import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

// Next.js pode criar várias instâncias em dev, evite múltiplas conexões:
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Filtro de período: ?inicio=2025-07-30T00:00:00.000Z&fim=2025-07-31T23:59:59.999Z
      const { inicio, fim } = req.query

      let where: any = {}
      if (inicio && fim) {
        where.dataSaidaReal = {
          gte: new Date(inicio as string),
          lte: new Date(fim as string),
        }
      }

      const checkouts = await prisma.checkOut.findMany({
        where,
        orderBy: { dataSaidaReal: 'desc' },
      })

      return res.status(200).json(checkouts)
    }

    if (req.method === 'POST') {
      // Criação de novo checkout
      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      if (
        !checkinId ||
        !dataSaidaReal ||
        typeof formaPagamento !== 'string' ||
        typeof total !== 'number'
      ) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' })
      }

      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId),
          dataSaidaReal: new Date(dataSaidaReal),
          formaPagamento,
          total: Number(total),
        },
      })

      return res.status(201).json(novoCheckout)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Método ${req.method} não suportado.` })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
