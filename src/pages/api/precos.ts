import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const precos = await prisma.precosConfig.findUnique({ where: { id: 1 } })
      return res.status(200).json({
        hospedagem: precos?.hospedagem ?? {
          individual: { comCafe: 0, semCafe: 0 },
          casal: { comCafe: 0, semCafe: 0 },
          tresPessoas: { comCafe: 0, semCafe: 0 },
          quatroPessoas: { comCafe: 0, semCafe: 0 },
          maisQuatro: { comCafe: 0, semCafe: 0 },
          criancas: { de0a3Gratuito: true, de4a9: 0, aPartir10: 'adulto' }
        },
        categoriasExtras: precos?.categoriasExtras ?? {}
      })
    }

    if (req.method === 'POST') {
      const { hospedagem, categoriasExtras } = req.body

      if (!hospedagem || typeof hospedagem !== 'object') {
        return res.status(400).json({ error: 'Hospedagem inválida!' })
      }

      const upserted = await prisma.precosConfig.upsert({
        where: { id: 1 },
        create: { hospedagem, categoriasExtras: categoriasExtras ?? {} },
        update: { hospedagem, categoriasExtras: categoriasExtras ?? {} }
      })
      return res.status(200).json(upserted)
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
