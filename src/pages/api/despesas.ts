import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: listar despesas
    if (req.method === 'GET') {
      const despesas = await prisma.despesa.findMany({ orderBy: { data: 'desc' } })
      return res.status(200).json(despesas)
    }

    // POST: criar despesa
    if (req.method === 'POST') {
      const { nome, valor, categoria, data } = req.body
      if (!nome || !valor || !categoria || !data) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
      }
      const nova = await prisma.despesa.create({
        data: {
          nome,
          valor: Number(valor),
          categoria,
          data: String(data),
        }
      })
      return res.status(201).json(nova)
    }

    // PUT: atualizar despesa
    if (req.method === 'PUT') {
      const { id, nome, valor, categoria, data } = req.body
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })
      const atualizada = await prisma.despesa.update({
        where: { id },
        data: { nome, valor: Number(valor), categoria, data: String(data) }
      })
      return res.status(200).json(atualizada)
    }

    // DELETE: excluir despesa
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })
      await prisma.despesa.delete({ where: { id } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno' })
  }
}
