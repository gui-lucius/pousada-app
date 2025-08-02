'use client'

import Layout from '@/components/layout/Layout'
import { useApenasAdmin } from '@/utils/proteger'
import { useEffect, useState, useCallback } from 'react'

// Resumo de faturamento
type ItemResumo = {
  nome: string
  quantidade: number
  total: number
}
type CategoriaResumo = {
  nome: string
  itens: ItemResumo[]
}

// Formatador de moeda BR
function real(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })
}

export default function FaturamentoPage() {
  useApenasAdmin()

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [modo, setModo] = useState<'rapido' | 'personalizado'>('rapido')
  const [selectedTab, setSelectedTab] = useState('hoje')
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([])
  const [totalGeral, setTotalGeral] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroItem, setFiltroItem] = useState('')

  // Função para aplicar filtros rápidos (hoje, mês, ano, etc)
  const aplicarFiltro = useCallback((inicioStr: string, fimStr: string) => {
    setInicio(inicioStr)
    setFim(fimStr)
  }, [])

  const filtrosRapidos = {
    hoje: () => {
      const inicio = new Date()
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
      setSelectedTab('hoje')
    },
    ultimos7: () => {
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 6)
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
      setSelectedTab('ultimos7')
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
      setSelectedTab('mes')
    },
    ano: () => {
      const ano = new Date().getFullYear()
      const inicio = new Date(`${ano}-01-01T00:00:00`)
      const fim = new Date(`${ano}-12-31T23:59:59.999`)
      aplicarFiltro(inicio.toISOString(), fim.toISOString())
      setSelectedTab('ano')
    }
  }

  // Carrega "hoje" ao abrir
  useEffect(() => { filtrosRapidos.hoje() }, [])

  // Carrega os dados toda vez que muda o período
  useEffect(() => {
    if (!inicio || !fim) return
    const carregarDados = async () => {
      setLoading(true)
      // 1. CHECKOUTS: Faturamento de hospedagem e fechamento (não some consumos internos de hóspedes!)
      const resCheckouts = await fetch(`/api/checkout?inicio=${inicio}&fim=${fim}`)
      const checkouts = resCheckouts.ok ? await resCheckouts.json() : []

      // 2. CONSUMOS AVULSOS: Comandas pagas que não têm checkin (avulso de restaurante, etc)
      const resConsumosAvulsos = await fetch(`/api/consumo?inicio=${inicio}&fim=${fim}&pago=true&avulso=true`)
      const consumosAvulsos = resConsumosAvulsos.ok ? await resConsumosAvulsos.json() : []

      // 3. OUTROS: Aqui tu pode adicionar outras fontes, se quiser (ex: vendas externas)

      // Monta resumo
      const resumo: Record<string, Record<string, { quantidade: number; total: number }>> = {}
      let total = 0

      // 1. CHECKOUTS (Hospedagem e fechamento de comandas de hóspedes)
      checkouts.forEach((c: any) => {
        // Supondo que c.total já inclui tudo de hospedagem + consumos do hóspede
        const categoria = 'Hospedagem'
        if (!resumo[categoria]) resumo[categoria] = {}
        const chave = c.chale || 'Chalé'
        if (!resumo[categoria][chave]) resumo[categoria][chave] = { quantidade: 0, total: 0 }
        resumo[categoria][chave].quantidade += 1
        resumo[categoria][chave].total += c.total // Usar "total" do checkout, não somar itens separados!
        total += c.total
      })

      // 2. CONSUMOS AVULSOS (comandas pagas e não vinculadas a checkin)
      consumosAvulsos.forEach((consumo: any) => {
        if (!Array.isArray(consumo.subcomandas)) return
        consumo.subcomandas.forEach((sub: any) => {
          if (!Array.isArray(sub.itens)) return
          sub.itens.forEach((item: any) => {
            if (!item.pago) return
            const categoria = item.categoria || 'Consumos Avulsos'
            if (!resumo[categoria]) resumo[categoria] = {}
            if (!resumo[categoria][item.nome]) resumo[categoria][item.nome] = { quantidade: 0, total: 0 }
            const subtotal = item.preco * item.quantidade
            resumo[categoria][item.nome].quantidade += item.quantidade
            resumo[categoria][item.nome].total += subtotal
            total += subtotal
          })
        })
      })

      // Mapeia categorias para a tela
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
      setLoading(false)
    }
    carregarDados()
  }, [inicio, fim])

  // Filtros categoria/item
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
      <div className="max-w-4xl mx-auto px-2 py-8 space-y-8 text-black">

        {/* Tabs Filtros */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <TabBtn text="Hoje"        active={selectedTab === 'hoje'}      onClick={() => { filtrosRapidos.hoje(); setModo('rapido') }}        icon="📅" />
          <TabBtn text="Últimos 7"   active={selectedTab === 'ultimos7'}  onClick={() => { filtrosRapidos.ultimos7(); setModo('rapido') }}   icon="🗓️" />
          <TabBtn text="Mês Atual"   active={selectedTab === 'mes'}       onClick={() => { filtrosRapidos.mes(); setModo('rapido') }}        icon="📆" />
          <TabBtn text="Ano Atual"   active={selectedTab === 'ano'}       onClick={() => { filtrosRapidos.ano(); setModo('rapido') }}        icon="📈" />
          <TabBtn text="Personalizado" active={modo === 'personalizado'}  onClick={() => setModo('personalizado')}                           icon="⚙️" />
        </div>

        {/* Data customizada */}
        {modo === 'personalizado' && (
          <div className="flex gap-4 mb-6 items-end flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Data de Início</label>
              <input
                type="date"
                value={inicio.slice(0,10)}
                onChange={e => setInicio(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Data de Fim</label>
              <input
                type="date"
                value={fim.slice(0,10)}
                onChange={e => setFim(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow mt-4 sm:mt-0"
              onClick={() => {
                if (!inicio || !fim) return
                setModo('personalizado')
                setSelectedTab('personalizado')
              }}
              type="button"
            >
              Filtrar
            </button>
          </div>
        )}

        {/* Filtros categoria/item */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Categoria</label>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="">Todas as categorias</option>
              {opcoesCategorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Item</label>
            <select value={filtroItem} onChange={e => setFiltroItem(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="">Todos os itens</option>
              {opcoesItens.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela das categorias */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 mt-6 animate-pulse justify-center">
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-400 animate-spin inline-block"></span>
            Carregando dados...
          </div>
        ) : (
          <>
          {categoriasFiltradas.map((cat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mt-4 space-y-2 transition hover:shadow-lg">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="rounded-full p-2 bg-blue-100">📁</span>
                {cat.nome}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-2">Item</th>
                    <th className="text-center p-2">Qtd</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.itens.map((item, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-2">{item.nome}</td>
                      <td className="p-2 text-center">{item.quantidade}</td>
                      <td className="p-2 text-right text-blue-800 font-bold">{real(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          </>
        )}

        {/* Card Total */}
        <div className="flex justify-center">
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl px-8 py-6 flex items-center gap-4 text-2xl font-bold shadow-sm">
            <span className="rounded-full p-2 bg-green-200 text-3xl">💰</span>
            Total Geral:&nbsp;
            <span className="text-green-800">{real(totalGeral)}</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

// TabButton reusável
function TabBtn({ text, active, onClick, icon }: { text: string, active: boolean, onClick: () => void, icon?: string }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition
        ${active
          ? 'bg-blue-600 text-white border-blue-700 shadow'
          : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}
      `}
      onClick={onClick}
      type="button"
    >
      {icon && <span className="bg-white text-xl rounded-full">{icon}</span>}
      {text}
    </button>
  )
}
