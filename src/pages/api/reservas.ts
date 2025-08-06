import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/utils/prisma'

// Força data para meia-noite UTC. Nunca retorna undefined!
function asMidnight(dateStr: string): Date {
  if (!dateStr) throw new Error('Data obrigatória faltando')
  // Garante 'YYYY-MM-DDT00:00:00.000Z'
  return new Date(dateStr.slice(0, 10) + 'T00:00:00.000Z')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Lista todas as reservas
    if (req.method === 'GET') {
      const reservas = await prisma.reserva.findMany({
        orderBy: { dataEntrada: 'asc' }
      })
      return res.status(200).json(reservas)
    }

    // POST: Cria uma nova reserva
    if (req.method === 'POST') {
      const {
        nome, documento, telefone, dataEntrada, dataSaida, numeroPessoas, chale,
        observacoes, valor, status,
        desconto = 0,
        valorPagoAntecipado = 0,
        criancas0a3 = 0,
        criancas4a9 = 0,
        email = ""
      } = req.body

      // Checagem dos campos obrigatórios
      if (
        !nome || !documento || !dataEntrada || !dataSaida ||
        typeof numeroPessoas === 'undefined' || !chale ||
        typeof valor === 'undefined' || !status
      ) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' })
      }

      const nova = await prisma.reserva.create({
        data: {
          nome,
          documento,
          telefone,
          email,
          dataEntrada: asMidnight(dataEntrada), // nunca undefined
          dataSaida: asMidnight(dataSaida),
          numeroPessoas: Number(numeroPessoas),
          chale,
          observacoes,
          valor: Number(valor),
          status,
          desconto: Number(desconto),
          valorPagoAntecipado: Number(valorPagoAntecipado),
          criancas0a3: Number(criancas0a3),
          criancas4a9: Number(criancas4a9),
        }
      })
      return res.status(201).json(nova)
    }

    // PUT: Atualiza reserva existente
    if (req.method === 'PUT') {
      const {
        id, nome, documento, telefone, dataEntrada, dataSaida, numeroPessoas, chale,
        observacoes, valor, status,
        desconto = 0,
        valorPagoAntecipado = 0,
        criancas0a3 = 0,
        criancas4a9 = 0,
        email = ""
      } = req.body

      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })

      // Mesmo check obrigatório das datas, para nunca dar undefined!
      if (!dataEntrada || !dataSaida) {
        return res.status(400).json({ error: 'Datas obrigatórias faltando.' })
      }

      const atualizada = await prisma.reserva.update({
        where: { id },
        data: {
          nome,
          documento,
          telefone,
          email,
          dataEntrada: asMidnight(dataEntrada),
          dataSaida: asMidnight(dataSaida),
          numeroPessoas: Number(numeroPessoas),
          chale,
          observacoes,
          valor: Number(valor),
          status,
          desconto: Number(desconto),
          valorPagoAntecipado: Number(valorPagoAntecipado),
          criancas0a3: Number(criancas0a3),
          criancas4a9: Number(criancas4a9),
        }
      })
      return res.status(200).json(atualizada)
    }

    // DELETE: Deleta reserva por ID (via body)
    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID obrigatório.' })
      await prisma.reserva.delete({ where: { id } })
      // Status 204 = No Content
      return res.status(204).end()
    }

    // Se não for nenhum dos métodos acima
    return res.status(405).json({ error: 'Método não suportado' })
  } catch (error: any) {
    console.error(error)
    // Retorna mensagem clara se erro vier de campo obrigatório faltando
    if (error.message && error.message.includes('Data obrigatória faltando')) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  }
}
