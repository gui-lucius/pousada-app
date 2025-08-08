// pages/api/faturamento.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error'],
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ============================= GET LISTA CATEGORIAS ===================
    if (req.method === 'GET' && req.query.action === 'categorias') {
      const faturamentos = await prisma.faturamento.findMany()

      const categoriasMap: Record<string, Set<string>> = {}

      faturamentos.forEach((f) => {
        if (f.tipo === 'hospedagem') {
          if (!categoriasMap['Hospedagem']) categoriasMap['Hospedagem'] = new Set()
          if (f.chale) categoriasMap['Hospedagem'].add(f.chale)
        }

        if (Array.isArray(f.itensComanda)) {
          f.itensComanda.forEach((item: any) => {
            const cat = item.categoria || 'Sem categoria'
            if (!categoriasMap[cat]) categoriasMap[cat] = new Set()
            if (item.produto) categoriasMap[cat].add(item.produto)
          })
        }
      })

      const categorias = Object.entries(categoriasMap).map(([nome, itens]) => ({
        nome,
        itens: Array.from(itens),
      }))

      return res.status(200).json(categorias)
    }

    // ============================= GET FATURAMENTO ========================
    if (req.method === 'GET') {
      const { inicio, fim, tipo, search, categoria, item } = req.query

      console.log('[FATURAMENTO][GET] filtros:', { inicio, fim, tipo, search, categoria, item })

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
      })

      if (!categoria && !item) {
        return res.status(200).json(faturamentos)
      }

      let totalQuantidade = 0
      let totalValor = 0

      faturamentos.forEach((f) => {
        if (String(categoria).toLowerCase() === 'hospedagem') {
          const chaleStr = Array.isArray(f.chale) ? f.chale.join(', ') : (f.chale ?? '')

          if (
            f.tipo === 'hospedagem' &&
            (!item || chaleStr.toLowerCase() === String(item).toLowerCase())
          ) {
            totalQuantidade += 1
            totalValor += f.valorHospedagem || 0
          }
        } else if (Array.isArray(f.itensComanda)) {
          f.itensComanda.forEach((i: any) => {
            const matchesCategoria = categoria
              ? String(i.categoria).toLowerCase() === String(categoria).toLowerCase()
              : true
            const matchesItem = item
              ? String(i.produto).toLowerCase() === String(item).toLowerCase()
              : true

            if (matchesCategoria && matchesItem) {
              totalQuantidade += Number(i.quantidade) || 0
              totalValor += Number(i.valorTotal) || 0
            }
          })
        }
      })

      return res.status(200).json({
        categoria: categoria || null,
        item: item || null,
        totalQuantidade,
        totalValor,
      })
    }

    // ============================= POST ===================================
    if (req.method === 'POST') {
      console.log('[FATURAMENTO][POST] payload recebido:', req.body)
      const data = req.body

      // Campos obrigatórios
      if (!data.tipo || !data.formaPagamento) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes (tipo, formaPagamento)' })
      }

      // 🔹 Evita salvar comanda_hospede fora do checkout
      if (data.tipo === 'comanda_hospede') {
        return res.status(400).json({ error: 'Comanda de hóspede só pode ser lançada no checkout.' })
      }

      // 🔹 Evita salvar comanda sem itens ou com valor zero
      if (Array.isArray(data.itensComanda)) {
        if (data.itensComanda.length === 0) {
          return res.status(400).json({ error: 'Comanda deve conter pelo menos 1 item.' })
        }
        const totalValor = data.itensComanda.reduce(
          (acc: number, item: any) => acc + (Number(item.valorTotal) || 0),
          0
        )
        if (totalValor <= 0) {
          return res.status(400).json({ error: 'Não é permitido lançar comanda com valor total 0.' })
        }
      }

      const payload: any = {
        ...data,
        criadoEm: data.criadoEm ? new Date(data.criadoEm) : undefined,
        dataEntrada: data.dataEntrada ? new Date(data.dataEntrada) : undefined,
        dataSaida: data.dataSaida ? new Date(data.dataSaida) : undefined,
        dataSaidaReal: data.dataSaidaReal ? new Date(data.dataSaidaReal) : undefined,
      }

      const novoFaturamento = await prisma.faturamento.create({
        data: payload,
      })

      return res.status(201).json(novoFaturamento)
    }

    // ============================= DELETE =================================
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) {
        return res.status(400).json({ error: 'Id obrigatório para deletar.' })
      }

      await prisma.faturamento.delete({ where: { id: id as string } })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: `Método ${req.method} não suportado.` })
  } catch (error: any) {
    console.error('[FATURAMENTO API][ERRO]:', error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    if (process.env.NODE_ENV === 'production') {
      await prisma.$disconnect()
    }
  }
}
