import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Lista comandas (filtra por ID se passado na query)
    if (req.method === 'GET') {
      const { id } = req.query
      if (id) {
        const comanda = await prisma.consumo.findUnique({ where: { id: String(id) } })
        if (!comanda) return res.status(404).json({ error: 'Comanda não encontrada' })
        return res.status(200).json(comanda)
      }
      // Lista todas abertas se não passar id
      const comandas = await prisma.consumo.findMany({
        where: { status: 'aberta' },
        orderBy: { criadoEm: 'desc' }
      })
      return res.status(200).json(comandas)
    }

    // POST: Cria nova comanda
    if (req.method === 'POST') {
      const { cliente, hospede, checkinId, subcomandas, status, criadoEm, updatedAt } = req.body

      // Validação: titular precisa existir
      if (
        !cliente ||
        typeof hospede !== 'boolean' ||
        !Array.isArray(subcomandas) ||
        subcomandas.length === 0 ||
        !subcomandas[0].nome
      ) {
        return res.status(400).json({ error: 'Dados inválidos: comanda precisa de titular (nome)' })
      }

      // Opcional: adicione tipo à subcomanda (hóspede/acompanhante)
      const subcomandasComTipo = subcomandas.map((s, idx) => ({
        ...s,
        tipo: idx === 0 ? 'hospede' : 'acompanhante'
      }))

      const agora = new Date()
      const checkinIdValido = hospede && checkinId ? checkinId : null

      const nova = await prisma.consumo.create({
        data: {
          cliente,
          hospede,
          checkinId: checkinIdValido,
          status: status || 'aberta',
          criadoEm: criadoEm ? new Date(criadoEm) : agora,
          updatedAt: updatedAt ? new Date(updatedAt) : agora,
          subcomandas: subcomandasComTipo,
        }
      })
      return res.status(201).json(nova)
    }

    // PUT: Atualiza comanda
    if (req.method === 'PUT') {
      const { id, ...data } = req.body
      if (!id) return res.status(400).json({ error: 'ID é obrigatório para atualizar' })
      const atualizada = await prisma.consumo.update({
        where: { id: String(id) },
        data
      })
      return res.status(200).json(atualizada)
    }

    // DELETE: Exclui comanda
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({ error: 'ID é obrigatório para exclusão' })
      }
      try {
        await prisma.consumo.delete({ where: { id: String(id) } })
        return res.status(204).end()
      } catch {
        return res.status(204).end()
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Método ${req.method} não suportado` })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
