// pages/api/faturamento.tsx

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

// Instancia o Prisma com logging de queries e erros
const prisma = new PrismaClient({
  log: ['query', 'error'],
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // ============================= GET ===================================
    if (req.method === 'GET') {
      const { inicio, fim, tipo, search } = req.query

      console.log('[FATURAMENTO][GET] filtros:', { inicio, fim, tipo, search })

      const where: any = {}
      if (inicio && fim) {
        where.criadoEm = {
          gte: new Date(inicio as string),
          lte: new Date(fim as string),
        }
      }
      if (tipo) {
        where.tipo = tipo
      }
      if (search) {
        where.OR = [
          { nomeHospede: { contains: search as string, mode: 'insensitive' } },
          { chale: { contains: search as string, mode: 'insensitive' } },
        ]
      }

      const faturamentos = await prisma.faturamento.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        include: {
          checkin: true,
          checkOut: true,
          consumo: true,
        },
      })

      console.log(
        `[FATURAMENTO][GET] retornou ${faturamentos.length} registros`
      )
      return res.status(200).json(faturamentos)
    }

    // ============================= POST ===================================
    if (req.method === 'POST') {
      console.log('[FATURAMENTO][POST] payload recebido:', req.body)
      const data = req.body

      // Validação simples
      if (!data.tipo || !data.formaPagamento) {
        console.warn(
          '[FATURAMENTO][POST] campos obrigatórios ausentes:',
          data
        )
        return res
          .status(400)
          .json({ error: 'Campos obrigatórios ausentes (tipo, formaPagamento)' })
      }

      // Prepara payload para o Prisma
      const payload: any = {
        ...data,
        criadoEm: data.criadoEm ? new Date(data.criadoEm) : undefined,
        dataEntrada: data.dataEntrada ? new Date(data.dataEntrada) : undefined,
        dataSaida: data.dataSaida ? new Date(data.dataSaida) : undefined,
        dataSaidaReal: data.dataSaidaReal
          ? new Date(data.dataSaidaReal)
          : undefined,
      }

      console.log('[FATURAMENTO][POST] vai criar com payload:', payload)
      const novoFaturamento = await prisma.faturamento.create({
        data: payload,
      })
      console.log(
        '[FATURAMENTO][POST] create retornou:',
        novoFaturamento
      )

      return res.status(201).json(novoFaturamento)
    }

    // ============================= DELETE ===================================
    if (req.method === 'DELETE') {
      const { id } = req.query
      console.log('[FATURAMENTO][DELETE] id recebido:', id)
      if (!id) {
        return res
          .status(400)
          .json({ error: 'Id obrigatório para deletar.' })
      }

      await prisma.faturamento.delete({ where: { id: id as string } })
      console.log('[FATURAMENTO][DELETE] registro deletado:', id)
      return res.status(204).end()
    }

    // ============================= MÉTODO NÃO SUPORTADO ====================
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res
      .status(405)
      .json({ error: `Método ${req.method} não suportado.` })
  } catch (error: any) {
    console.error('[FATURAMENTO API][ERRO]:', error)
    return res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    // Desconecta o Prisma em produção para evitar conexões ociosas
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect()
    }
  }
}
