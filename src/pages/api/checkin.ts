import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper para garantir "YYYY-MM-DD" => sempre meia-noite UTC no banco
function asMidnight(dateStr: string) {
  if (!dateStr) return undefined
  // Garante 'YYYY-MM-DDT00:00:00.000Z'
  return new Date(dateStr.slice(0, 10) + 'T00:00:00.000Z')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const checkins = await prisma.checkIn.findMany({
        orderBy: { entrada: 'desc' },
      })
      return res.status(200).json(checkins)
    }

    if (req.method === 'POST') {
      const data = req.body

      // Sempre forçar só a data, nunca hora!
      if (data.entrada) data.entrada = asMidnight(data.entrada)
      if (data.saida) data.saida = asMidnight(data.saida)
      if (data.valor) data.valor = Number(data.valor)

      const novo = await prisma.checkIn.create({ data })
      return res.status(201).json(novo)
    }

    if (req.method === 'PUT') {
      const { id, ...data } = req.body
      if (data.entrada) data.entrada = asMidnight(data.entrada)
      if (data.saida) data.saida = asMidnight(data.saida)
      if (data.valor) data.valor = Number(data.valor)

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
