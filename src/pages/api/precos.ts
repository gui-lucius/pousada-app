import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: retorna o config atual
    if (req.method === 'GET') {
      const precos = await prisma.precosConfig.findUnique({ where: { id: 1 } })
      return res.status(200).json({
        hospedagem: precos?.hospedagem ?? {},
        categoriasExtras: precos?.categoriasExtras ?? {}
      })
    }

    // POST: cria/atualiza config
    if (req.method === 'POST') {
      const { hospedagem, categoriasExtras } = req.body
      const upserted = await prisma.precosConfig.upsert({
        where: { id: 1 },
        create: { hospedagem, categoriasExtras },
        update: { hospedagem, categoriasExtras }
      })
      return res.status(200).json(upserted)
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
