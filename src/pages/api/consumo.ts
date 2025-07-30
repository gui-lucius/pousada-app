import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const comandas = await prisma.consumo.findMany({
        where: { status: 'aberta' },
        orderBy: { criadoEm: 'desc' }
      })
      return res.status(200).json(comandas)
    }

    if (req.method === 'POST') {
      const { cliente, hospede, checkinId, subcomandas } = req.body

      if (!cliente || typeof hospede !== 'boolean' || !checkinId || !Array.isArray(subcomandas)) {
        return res.status(400).json({ error: 'Dados inválidos' })
      }

      const nova = await prisma.consumo.create({
        data: {
          cliente,
          hospede,
          checkinId,
          status: 'aberta',
          criadoEm: new Date(),
          subcomandas,
        }
      })
      return res.status(201).json(nova)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório para exclusão' })
      }
      await prisma.consumo.delete({ where: { id } })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: `Método ${req.method} não suportado` })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
