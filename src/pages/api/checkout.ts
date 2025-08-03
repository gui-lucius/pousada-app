// pages/api/checkout.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Filtro de período: ?inicio=2025-07-30T00:00:00.000Z&fim=2025-07-31T23:59:59.999Z
      const { inicio, fim } = req.query

      let where: any = {}
      if (inicio && fim) {
        where.dataSaidaReal = {
          gte: new Date(inicio as string),
          lte: new Date(fim as string),
        }
      }

      // Inclui checkin COMPLETO e consumos internos do hóspede!
      const checkouts = await prisma.checkOut.findMany({
        where,
        orderBy: { dataSaidaReal: 'desc' },
        include: {
          checkin: {
            select: {
              id: true,
              chale: true,
              valor: true, // <- esse é o valor da hospedagem!
              entrada: true,
              saida: true,
              nome: true,
              // Inclui os consumos internos do hóspede, se quiser detalhar no faturamento
              consumos: {
                select: {
                  id: true,
                  status: true,
                  criadoEm: true,
                  updatedAt: true,
                  subcomandas: true, // geralmente json ou array
                }
              }
            }
          }
        }
      })

      return res.status(200).json(checkouts)
    }

    if (req.method === 'POST') {
      // Criação de novo checkout
      const { checkinId, dataSaidaReal, formaPagamento, total } = req.body

      if (
        !checkinId ||
        !dataSaidaReal ||
        typeof formaPagamento !== 'string' ||
        typeof total !== 'number'
      ) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando ou inválidos.' })
      }

      // Cria o checkout
      const novoCheckout = await prisma.checkOut.create({
        data: {
          checkinId: Number(checkinId),
          dataSaidaReal: new Date(dataSaidaReal),
          formaPagamento,
          total: Number(total),
        },
      })

      // Busca todos os consumos desse checkin
      const consumos = await prisma.consumo.findMany({
        where: { checkinId: Number(checkinId) }
      })

      // Atualiza cada consumo, marcando todos os itens das subcomandas como pagos
      for (const consumo of consumos) {
        let subcomandas: any[] = []
        try {
          if (Array.isArray(consumo.subcomandas)) {
            subcomandas = consumo.subcomandas
          } else if (typeof consumo.subcomandas === "string") {
            subcomandas = JSON.parse(consumo.subcomandas)
            if (!Array.isArray(subcomandas)) subcomandas = []
          } else if (consumo.subcomandas && typeof consumo.subcomandas === "object") {
            subcomandas = []
          } else {
            subcomandas = []
          }
        } catch { subcomandas = [] }

        subcomandas = subcomandas.map((sub: any) => ({
          ...sub,
          itens: (sub.itens || []).map((item: any) => ({
            ...item,
            pago: true
          }))
        }))

        await prisma.consumo.update({
          where: { id: consumo.id },
          data: { subcomandas: subcomandas as Prisma.JsonArray, status: 'pago' }
        })
      }

      return res.status(201).json(novoCheckout)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Método ${req.method} não suportado.` })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' })
  } finally {
    // Prisma só desconecta fora do ambiente serverless:
    if (process.env.NODE_ENV !== 'development') {
      await prisma.$disconnect()
    }
  }
}
