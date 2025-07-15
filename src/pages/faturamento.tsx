'use client'

import Layout from '@/components/layout/Layout'
import { useApenasAdmin } from '@/utils/proteger'
import { useEffect, useState, useCallback } from 'react'
import { db, Checkout, Consumo } from '@/utils/db'

type ItemResumo = {
  nome: string
  quantidade: number
  total: number
}

type CategoriaResumo = {
  nome: string
  itens: ItemResumo[]
}

// 🔧 Agora isso é uma função fora do componente para evitar warning de dependência
function criarFiltrosRapidos(aplicarFiltro: (inicio: string, fim: string) => void) {
  return {
    hoje: () => {
      const inicio = new Date()
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
    },
    ultimos7: () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 6)
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
    },
    mes: () => {
      const agora = new Date()
      const ano = agora.getFullYear()
      const mes = agora.getMonth()
      const inicio = new Date(ano, mes, 1)
      const fim = new Date(ano, mes + 1, 0)
      inicio.setHours(0, 0, 0, 0)
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
    },
    ano: () => {
      const ano = new Date().getFullYear()
      const inicio = new Date(`${ano}-01-01T00:00:00`)
      const fim = new Date(`${ano}-12-31T23:59:59.999`)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
    },
  }
}

export default function FaturamentoPage() {
  useApenasAdmin()

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [modo, setModo] = useState<'rapido' | 'personalizado'>('rapido')
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([])
  const [totalGeral, setTotalGeral] = useState(0)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroItem, setFiltroItem] = useState('')

  const aplicarFiltro = useCallback((inicioStr: string, fimStr: string) => {
    setInicio(inicioStr)
    setFim(fimStr)
  }, [])

  const filtrosRapidos = criarFiltrosRapidos(aplicarFiltro)

  useEffect(() => {
    filtrosRapidos.hoje()
  }, [filtrosRapidos])

  useEffect(() => {
    if (!inicio || !fim) return

    const carregarDados = async () => {
      const dataInicio = new Date(inicio)
      const dataFim = new Date(fim)

      const checkouts = await db.checkouts.toArray()
      const consumos = await db.consumos.toArray()

      const resumo: Record<string, Record<string, { quantidade: number; total: number }>> = {}
      let total = 0

      checkouts.forEach((c: Checkout) => {
        const data = new Date(c.data)
        if (data < dataInicio || data > dataFim) return

        const categoria = 'Hospedagem'
        if (!resumo[categoria]) resumo[categoria] = {}

        const chave = c.chale || 'Chalé'
        if (!resumo[categoria][chave]) {
          resumo[categoria][chave] = { quantidade: 0, total: 0 }
        }

        resumo[categoria][chave].quantidade += 1
        resumo[categoria][chave].total += c.valor
        total += c.valor
      })

      consumos.forEach((consumo: Consumo) => {
        const data = new Date(consumo.criadoEm)
        if (data < dataInicio || data > dataFim) return

        consumo.subcomandas.forEach(sub => {
          sub.itens.forEach(item => {
            if (!item.pago) return

            const categoria = item.categoria || 'Outros'
            if (!resumo[categoria]) resumo[categoria] = {}

            if (!resumo[categoria][item.nome]) {
              resumo[categoria][item.nome] = { quantidade: 0, total: 0 }
            }

            const subtotal = item.preco * item.quantidade
            resumo[categoria][item.nome].quantidade += item.quantidade
            resumo[categoria][item.nome].total += subtotal
            total += subtotal
          })
        })
      })

      const categoriasFormatadas: CategoriaResumo[] = Object.entries(resumo).map(([nome, itens]) => ({
        nome,
        itens: Object.entries(itens).map(([itemNome, dados]) => ({
          nome: itemNome,
          quantidade: dados.quantidade,
          total: dados.total,
        })),
      }))

      setCategorias(categoriasFormatadas)
      setTotalGeral(total)
    }

    carregarDados()
  }, [inicio, fim])

  const categoriasFiltradas = categorias
    .filter(c => !filtroCategoria || c.nome === filtroCategoria)
    .map(c => ({
      ...c,
      itens: c.itens.filter(i => !filtroItem || i.nome === filtroItem),
    }))
    .filter(c => c.itens.length > 0)

  const opcoesCategorias = categorias.map(c => c.nome)
  const opcoesItens = [...new Set(categorias.flatMap(c => c.itens.map(i => i.nome)))].sort()

  return (
    <Layout title="📊 Faturamento">
      <div className="max-w-4xl mx-auto px-4 space-y-6 text-black">
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => { filtrosRapidos.hoje(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Hoje</button>
          <button onClick={() => { filtrosRapidos.ultimos7(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Últimos 7 dias</button>
          <button onClick={() => { filtrosRapidos.mes(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Mês Atual</button>
          <button onClick={() => { filtrosRapidos.ano(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Ano Atual</button>
          <button onClick={() => setModo('personalizado')} className="bg-gray-300 text-black px-4 py-2 rounded shadow">Personalizado</button>
        </div>

        {modo === 'personalizado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Início</label>
              <input type="date" value={inicio.slice(0, 10)} onChange={e => setInicio(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Fim</label>
              <input type="date" value={fim.slice(0, 10)} onChange={e => setFim(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filtrar por Categoria</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Todas as categorias</option>
              {opcoesCategorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filtrar por Item</label>
            <select value={filtroItem} onChange={e => setFiltroItem(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Todos os itens</option>
              {opcoesItens.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {categoriasFiltradas.map((cat, idx) => (
          <div key={idx} className="bg-white p-4 border rounded shadow space-y-2">
            <h3 className="text-lg font-semibold">{cat.nome}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Item</th>
                  <th className="text-center p-2">Qtd</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {cat.itens.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{item.nome}</td>
                    <td className="p-2 text-center">{item.quantidade}</td>
                    <td className="p-2 text-right">R$ {item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="text-center text-xl font-bold text-green-700">
          💰 Total Geral: R$ {totalGeral.toFixed(2)}
        </div>
      </div>
    </Layout>
  )
}
