import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const checkins = await prisma.checkIn.findMany({
        orderBy: { entrada: 'desc' },
      })
      return res.status(200).json(checkins)
    }

    if (req.method === 'POST') {
      // Agora pega TODOS os campos enviados
      const data = req.body

      // Ajusta os campos de data e valor
      if (data.entrada) data.entrada = new Date(data.entrada)
      if (data.saida) data.saida = new Date(data.saida)
      if (data.valor) data.valor = Number(data.valor)
      
      // Cria o check-in com todos os dados recebidos
      const novo = await prisma.checkIn.create({ data })

      return res.status(201).json(novo)
    }

    if (req.method === 'PUT') {
      const { id, ...data } = req.body
      const atualizado = await prisma.checkIn.update({
        where: { id: Number(id) },
        data,
      })
      return res.status(200).json(atualizado)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      await prisma.checkIn.delete({ where: { id: Number(id) } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
