import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: listar todas as reservas
    if (req.method === 'GET') {
      const reservas = await prisma.reserva.findMany({ orderBy: { dataEntrada: 'asc' } })
      return res.status(200).json(reservas)
    }

    // POST: criar reserva
    if (req.method === 'POST') {
      const {
        nome, documento, telefone, dataEntrada, dataSaida, numeroPessoas, chale,
        observacoes, valor, status
      } = req.body
      // Validação rápida
      if (!nome || !documento || !dataEntrada || !dataSaida || !numeroPessoas || !chale || !valor || !status) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })
      }
      const nova = await prisma.reserva.create({
        data: {
          nome,
          documento,
          telefone,
          dataEntrada: new Date(dataEntrada),
          dataSaida: new Date(dataSaida),
          numeroPessoas: Number(numeroPessoas),
          chale,
          observacoes,
          valor: Number(valor),
          status,
        }
      })
      return res.status(201).json(nova)
    }

    // PUT: editar reserva
    if (req.method === 'PUT') {
      const {
        id, nome, documento, telefone, dataEntrada, dataSaida, numeroPessoas, chale,
        observacoes, valor, status
      } = req.body
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })
      const atualizada = await prisma.reserva.update({
        where: { id },
        data: {
          nome,
          documento,
          telefone,
          dataEntrada: new Date(dataEntrada),
          dataSaida: new Date(dataSaida),
          numeroPessoas: Number(numeroPessoas),
          chale,
          observacoes,
          valor: Number(valor),
          status,
        }
      })
      return res.status(200).json(atualizada)
    }

    // DELETE: excluir reserva
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })
      await prisma.reserva.delete({ where: { id } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
