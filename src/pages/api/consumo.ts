// pages/api/consumo.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[CONSUMO API] ➡️ ${req.method} ${req.url}`)

  try {
    // ============================= GET ===================================
    if (req.method === 'GET') {
      console.log('[CONSUMO API][GET] Query params:', req.query)
      const { id, inicio, fim, pago, avulso } = req.query

      if (id) {
        console.log(`[CONSUMO API][GET] buscando comanda por id: ${id}`)
        const comanda = await prisma.consumo.findUnique({
          where: { id: String(id) },
        })
        if (!comanda) {
          console.warn(`[CONSUMO API][GET] comanda ${id} não encontrada`)
          return res.status(404).json({ error: 'Comanda não encontrada' })
        }
        console.log('[CONSUMO API][GET] comanda encontrada:', comanda)
        return res.status(200).json(comanda)
      }

      const where: any = {}
      if (inicio && fim) {
        where.criadoEm = {
          gte: new Date(inicio as string),
          lte: new Date(fim as string),
        }
      }
      if (avulso === 'true') where.checkinId = null
      if (pago === 'true') where.status = 'pago'

      console.log('[CONSUMO API][GET] where filter:', where)
      const comandas = await prisma.consumo.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
      })
      console.log(`[CONSUMO API][GET] retornou ${comandas.length} comandas`)
      return res.status(200).json(comandas)
    }

    // ============================= POST ===================================
    if (req.method === 'POST') {
      console.log('[CONSUMO API][POST] Body recebido:', req.body)
      const { cliente, hospede, checkinId, subcomandas, status, criadoEm, updatedAt } = req.body

      // validação
      if (
        !cliente ||
        typeof hospede !== 'boolean' ||
        !Array.isArray(subcomandas) ||
        subcomandas.length === 0 ||
        !subcomandas[0].nome
      ) {
        console.error('[CONSUMO API][POST] dados inválidos:', req.body)
        return res.status(400).json({ error: 'Dados inválidos: comanda precisa de titular (nome)' })
      }

      // marca tipo nas subcomandas
      const subcomandasComTipo = subcomandas.map((s: any, i: number) => ({
        ...s,
        tipo: i === 0 ? 'hospede' : 'acompanhante',
      }))

      const now = new Date()
      const createData: any = {
        cliente,
        hospede,
        status: status || 'aberta',
        criadoEm: criadoEm ? new Date(criadoEm) : now,
        updatedAt: updatedAt ? new Date(updatedAt) : now,
        subcomandas: subcomandasComTipo as any,
        checkin: hospede && checkinId
          ? { connect: { id: Number(checkinId) } }
          : undefined,
      }

      console.log('[CONSUMO API][POST] criando comanda com payload:', createData)
      const nova = await prisma.consumo.create({ data: createData })
      console.log('[CONSUMO API][POST] comanda criada:', nova)
      return res.status(201).json(nova)
    }

    // ============================= PUT ====================================
    if (req.method === 'PUT') {
      console.log('[CONSUMO API][PUT] Body recebido:', req.body)
      const { id, ...data } = req.body
      if (!id) {
        console.error('[CONSUMO API][PUT] ID obrigatório para atualizar')
        return res.status(400).json({ error: 'ID é obrigatório para atualizar' })
      }

      console.log(`[CONSUMO API][PUT] buscando status antes do update para id: ${id}`)
      const antes = await prisma.consumo.findUnique({ where: { id: String(id) } })
      console.log('[CONSUMO API][PUT] status antes:', antes?.status)

      const novoStatus = data.status === 'paga' ? 'pago' : data.status
      const updateData: any = { ...data, status: novoStatus }

      console.log('[CONSUMO API][PUT] atualizando com dados:', updateData)
      const atualizada = await prisma.consumo.update({
        where: { id: String(id) },
        data: updateData,
      })
      console.log('[CONSUMO API][PUT] comanda atualizada:', atualizada)

      // se mudou para 'pago', cria faturamento e associa
      if (antes?.status !== 'pago' && novoStatus === 'pago') {
        console.log('[CONSUMO API][PUT] status mudou para "pago", verificando faturamento existente...')

        const jaExiste = await prisma.faturamento.findFirst({
          where: {
            referenciaId: atualizada.id,
            tipo: atualizada.hospede ? 'comanda_hospede' : 'comanda_avulsa',
          },
        })

        if (jaExiste) {
          console.log(`[CONSUMO API][PUT] faturamento já existe para consumo ${atualizada.id}, não criando duplicata`)
          return res.status(200).json(atualizada)
        }

        // calcula total
        let totalComanda = 0
        let itens: any = atualizada.subcomandas
        if (typeof itens === 'string') {
          try { itens = JSON.parse(itens) } catch { itens = [] }
        }
        if (Array.isArray(itens)) {
          for (const sub of itens) {
            if (Array.isArray(sub.itens)) {
              for (const it of sub.itens) {
                if (it.pago) totalComanda += it.preco * it.quantidade
              }
            }
          }
        }
        console.log('[CONSUMO API][PUT] totalComanda calculado:', totalComanda)

        const faturamento = await prisma.$transaction(async (tx) => {
          const ft = await tx.faturamento.create({
            data: {
              tipo: atualizada.hospede ? 'comanda_hospede' : 'comanda_avulsa',
              referenciaId: atualizada.id,
              checkinId: atualizada.checkinId ?? undefined,
              nomeHospede: atualizada.cliente,
              valorComanda: totalComanda,
              total: totalComanda,
              formaPagamento: data.formaPagamento || 'não informado',
              criadoEm: new Date(),
              itensComanda: Array.isArray(itens) ? itens : [],
            },
          })
          await tx.consumo.update({
            where: { id: String(id) },
            data: { faturamentoId: ft.id },
          })
          return ft
        })
        console.log('[CONSUMO API][PUT] faturamento criado e associado:', faturamento)
      }

      return res.status(200).json(atualizada)
    }

    // ============================= DELETE =================================
    if (req.method === 'DELETE') {
      console.log('[CONSUMO API][DELETE] Body recebido:', req.body)
      const { id } = req.body
      if (!id) {
        console.error('[CONSUMO API][DELETE] ID obrigatório para exclusão')
        return res.status(400).json({ error: 'ID é obrigatório para exclusão' })
      }
      await prisma.consumo.delete({ where: { id: String(id) } })
      console.log(`[CONSUMO API][DELETE] comanda ${id} deletada`)
      return res.status(204).end()
    }

    // ========================= MÉTODO NÃO SUPORTADO ========================
    console.warn('[CONSUMO API] método não suportado:', req.method)
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: `Método ${req.method} não suportado` })
  } catch (error: any) {
    console.error('[CONSUMO API][ERRO]:', error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    await prisma.$disconnect()
    console.log('[CONSUMO API] ✅ request finalizada')
  }
}
