import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: lista todos os check-ins
    if (req.method === 'GET') {
      const checkins = await prisma.checkIn.findMany({
        orderBy: { entrada: 'desc' },
      })
      return res.status(200).json(checkins)
    }

    // POST: cria novo check-in
    if (req.method === 'POST') {
      const {
        nome,
        chale,
        entrada,
        saida,
        valor,
        // adicione outros campos conforme seu formulário!
        // Exemplo:
        telefone,
        adultos,
        criancas0a3,
        criancas4a9,
        valorEntrada,
        descontoPersonalizado
      } = req.body

      const novo = await prisma.checkIn.create({
        data: {
          nome,
          chale,
          entrada: new Date(entrada),
          saida: new Date(saida),
          valor: Number(valor),
          telefone: telefone ?? '',
          adultos: adultos ?? '1',
          criancas0a3: criancas0a3 ?? '0',
          criancas4a9: criancas4a9 ?? '0',
          valorEntrada: valorEntrada ?? '0',
          descontoPersonalizado: descontoPersonalizado ?? '',
          // ...adicione outros campos se necessário
        }
      })
      return res.status(201).json(novo)
    }

    // PUT: atualizar check-in
    if (req.method === 'PUT') {
      const {
        id,
        ...data
      } = req.body
      const atualizado = await prisma.checkIn.update({
        where: { id: Number(id) },
        data,
      })
      return res.status(200).json(atualizado)
    }

    // DELETE: excluir check-in
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
