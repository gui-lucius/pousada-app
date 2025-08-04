'use client'

import Layout from '@/components/layout/Layout'
import { useEffect, useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'

// Tipos
type Checkout = {
  id: string
  total: number
  dataSaidaReal: string
}
type ItemComanda = {
  nome: string
  preco: number
  quantidade: number
  pago: boolean
  categoria?: string
}
type Subcomanda = {
  nome?: string
  itens: ItemComanda[]
}
type Consumo = {
  id: string | number
  cliente: string
  hospede: boolean
  checkinId: string | number | null
  status: string
  criadoEm: string
  subcomandas: Subcomanda[]
}
type CategoriaResumo = {
  total: number
  itens: Record<string, { quantidade: number, valor: number }>
}

// Helpers
function real(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })
}
function formatPeriodo(inicio: string, fim: string) {
  if (!inicio || !fim) return ''
  const d1 = parseISO(inicio)
  const d2 = parseISO(fim)
  if (!isValid(d1) || !isValid(d2)) return ''
  if (inicio === fim) return format(d1, 'dd/MM/yyyy')
  return `${format(d1, 'dd/MM/yyyy')} — ${format(d2, 'dd/MM/yyyy')}`
}

export default function FaturamentoPage() {
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [selectedTab, setSelectedTab] = useState('hoje')
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [carregando, setCarregando] = useState(false)

  // Filtros rápidos ajustados
  const filtrosRapidos = {
    hoje: () => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      setInicio(hoje.toISOString())
      setFim(fim.toISOString())
      setSelectedTab('hoje')
    },
    ultimos7: () => {
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      const inicio = new Date(fim)
      inicio.setDate(fim.getDate() - 6)
      inicio.setHours(0, 0, 0, 0)
      setInicio(inicio.toISOString())
      setFim(fim.toISOString())
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
      setInicio(inicio.toISOString())
      setFim(fim.toISOString())
      setSelectedTab('mes')
    },
    ano: () => {
      const ano = new Date().getFullYear()
      const inicio = new Date(ano, 0, 1)
      inicio.setHours(0, 0, 0, 0)
      const fim = new Date(ano, 11, 31)
      fim.setHours(23, 59, 59, 999)
      setInicio(inicio.toISOString())
      setFim(fim.toISOString())
      setSelectedTab('ano')
    }
  }

  useEffect(() => { filtrosRapidos.hoje() }, [])

  useEffect(() => {
    if (!inicio || !fim) return
    setCarregando(true)
    Promise.all([
      fetch(`/api/checkout?inicio=${inicio}&fim=${fim}`).then(res => res.json()),
      fetch(`/api/consumo?inicio=${inicio}&fim=${fim}`).then(res => res.json())
    ]).then(([ckts, cnsms]) => {
      setCheckouts(ckts)
      setConsumos(cnsms)
    }).finally(() => setCarregando(false))
  }, [inicio, fim])

  // SOMA TOTAL HOSPEDAGEM
  const totalHospedagem = checkouts.reduce((sum, c) => sum + (c.total || 0), 0)

  // AGRUPA COMANDAS ITENS PAGOS
  const resumoCategorias: Record<string, CategoriaResumo> = {}
  for (const comanda of consumos) {
    for (const sub of comanda.subcomandas || []) {
      for (const item of sub.itens || []) {
        if (!item.pago) continue
        const categoria = (item.categoria
          || (comanda.hospede ? 'Extras Hóspedes' : 'Comandas Avulsas'))
        if (!resumoCategorias[categoria]) resumoCategorias[categoria] = { total: 0, itens: {} }
        resumoCategorias[categoria].total += item.preco * item.quantidade
        if (!resumoCategorias[categoria].itens[item.nome]) {
          resumoCategorias[categoria].itens[item.nome] = { quantidade: 0, valor: 0 }
        }
        resumoCategorias[categoria].itens[item.nome].quantidade += item.quantidade
        resumoCategorias[categoria].itens[item.nome].valor += item.preco * item.quantidade
      }
    }
  }

  // Soma total de itens/comandas
  const totalComandas = Object.values(resumoCategorias).reduce((sum, c) => sum + c.total, 0)

  // Ordem de exibição das categorias
  const categoriasOrdem = [
    'Hospedagem',
    'Comandas Avulsas',
    'Extras Hóspedes',
    ...Object.keys(resumoCategorias)
      .filter(cat => !['Comandas Avulsas', 'Extras Hóspedes'].includes(cat))
      .sort()
  ]

  return (
    <Layout title="📊 Faturamento">
      <div className="max-w-4xl mx-auto px-2 py-8 text-black">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <TabBtn text="Hoje"        active={selectedTab === 'hoje'}      onClick={filtrosRapidos.hoje}        icon="📅" />
          <TabBtn text="Últimos 7"   active={selectedTab === 'ultimos7'}  onClick={filtrosRapidos.ultimos7}   icon="🗓️" />
          <TabBtn text="Mês Atual"   active={selectedTab === 'mes'}       onClick={filtrosRapidos.mes}        icon="📆" />
          <TabBtn text="Ano Atual"   active={selectedTab === 'ano'}       onClick={filtrosRapidos.ano}        icon="📈" />
          <TabBtn text="Personalizado" active={selectedTab === 'personalizado'}
            onClick={() => setSelectedTab('personalizado')}
            icon="⚙️"
          />
        </div>
        {/* Filtro personalizado */}
        {selectedTab === 'personalizado' && (
          <div className="flex gap-4 mb-8 items-end flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data de Início</label>
              <input
                type="date"
                value={inicio ? new Date(inicio).toISOString().slice(0,10) : ''}
                onChange={e => {
                  const date = new Date(e.target.value)
                  date.setHours(0, 0, 0, 0)
                  setInicio(date.toISOString())
                }}
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data de Fim</label>
              <input
                type="date"
                value={fim ? new Date(fim).toISOString().slice(0,10) : ''}
                onChange={e => {
                  const date = new Date(e.target.value)
                  date.setHours(23, 59, 59, 999)
                  setFim(date.toISOString())
                }}
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow mt-4 sm:mt-0"
              onClick={() => { if (inicio && fim) setSelectedTab('personalizado') }}
              type="button"
            >
              Filtrar
            </button>
          </div>
        )}
        {/* Resumo Período */}
        <div className="mb-8 text-center text-lg font-medium text-blue-900">
          <span className="bg-blue-50 px-4 py-1 rounded-full">
            Período: {formatPeriodo(inicio, fim)}
          </span>
        </div>
        {/* Cards Totais */}
        <div className="flex flex-wrap gap-6 justify-center mb-12">
          <ResumoCard
            label="Hospedagem"
            value={real(totalHospedagem)}
            icon="🏨"
            color="text-blue-700"
            bg="bg-blue-100"
          />
          <ResumoCard
            label="Itens/Comandas"
            value={real(totalComandas)}
            icon="🧾"
            color="text-green-700"
            bg="bg-green-100"
          />
          <ResumoCard
            label="Total Geral"
            value={real(totalHospedagem + totalComandas)}
            icon="💰"
            color="text-purple-700"
            bg="bg-purple-100"
            valueClass="text-xl"
          />
        </div>
        {/* Detalhamento por categoria */}
        <div className="space-y-7">
          <CategoriaBox nome="Hospedagem" total={totalHospedagem} itens={undefined} hideIfZero />
          {categoriasOrdem.filter(cat => cat !== 'Hospedagem').map(cat => (
            <CategoriaBox
              key={cat}
              nome={cat}
              total={resumoCategorias[cat]?.total || 0}
              itens={resumoCategorias[cat]?.itens}
              hideIfZero
            />
          ))}
        </div>
        {/* Vazio */}
        {totalHospedagem + totalComandas === 0 && !carregando && (
          <div className="text-gray-500 text-center mt-12 text-lg">Nenhum faturamento encontrado no período selecionado.</div>
        )}
        {carregando && (
          <div className="flex items-center gap-2 text-blue-600 justify-center mt-10 animate-pulse">
            <span className="w-5 h-5 rounded-full border-2 border-blue-300 border-t-blue-700 animate-spin inline-block"></span>
            Carregando...
          </div>
        )}
      </div>
    </Layout>
  )
}

// TabButton UI
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

// Card de Resumo
function ResumoCard({
  label, value, icon, color, bg, valueClass = ''
}: {
  label: string
  value: string
  icon: string
  color: string
  bg: string
  valueClass?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl shadow border px-8 py-5 min-w-[180px] ${bg}`}>
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-bold text-sm text-gray-700">{label}</span>
      <span className={`font-bold text-lg mt-1 ${color} ${valueClass}`}>{value}</span>
    </div>
  )
}

// Box Categoria + Itens
function CategoriaBox({ nome, total, itens, hideIfZero = false }: {
  nome: string
  total: number
  itens?: Record<string, { quantidade: number, valor: number }>
  hideIfZero?: boolean
}) {
  if (hideIfZero && !total) return null
  return (
    <div className="bg-white border shadow rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-blue-900">{nome}</span>
        <span className="text-green-700 bg-green-100 rounded px-4 py-1 font-bold text-lg">
          R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      {itens && Object.keys(itens).length > 0 && (
        <ul className="text-sm text-gray-700 mt-2 space-y-1">
          {Object.entries(itens)
            .sort((a, b) => b[1].valor - a[1].valor)
            .map(([nome, d]) => (
              <li key={nome} className="flex justify-between items-center border-b last:border-0 py-1">
                <span>
                  <span className="text-gray-900">{nome}</span>
                  <span className="ml-2 text-xs bg-gray-50 text-gray-500 rounded px-2">{d.quantidade}x</span>
                </span>
                <span className="font-medium text-blue-700">
                  R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
        </ul>
      )}
      {(!itens || Object.keys(itens).length === 0) && (
        <div className="text-gray-400 text-xs mt-2">Sem itens nesta categoria.</div>
      )}
    </div>
  )
}
