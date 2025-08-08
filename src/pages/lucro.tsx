'use client'

import Layout from '@/components/layout/Layout'
import { useApenasAdmin } from '@/utils/proteger'
import { useEffect, useState } from 'react'

type Faturamento = {
  id: string
  valorHospedagem?: number
  valorComanda?: number
  total?: number
}
type Despesa = {
  id: string
  valor: number
}

export default function LucroPage() {
  useApenasAdmin()

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [modo, setModo] = useState<'rapido' | 'personalizado'>('rapido')
  const [selectedTab, setSelectedTab] = useState('hoje')
  const [faturamento, setFaturamento] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [loading, setLoading] = useState(false)

  function real(n: number) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })
  }

  // Filtros rápidos
  const aplicarFiltro = (inicioStr: string, fimStr: string) => {
    setInicio(inicioStr)
    setFim(fimStr)
  }
  const filtrosRapidos = {
    hoje: () => {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      aplicarFiltro(hoje.toISOString(), fim.toISOString())
      setSelectedTab('hoje')
    },
    ultimos7: () => {
      const fim = new Date()
      fim.setHours(23, 59, 59, 999)
      const inicio = new Date()
      inicio.setDate(fim.getDate() - 6)
      inicio.setHours(0, 0, 0, 0)
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
      aplicarFiltro(`${ano}-01-01T00:00:00.000Z`, `${ano}-12-31T23:59:59.999Z`)
      setSelectedTab('ano')
    }
  }

  useEffect(() => { filtrosRapidos.hoje() }, [])

  useEffect(() => {
    if (!inicio || !fim) return
    const fetchDados = async () => {
      setLoading(true)
      try {
        // 1. Faturamento: usa mesma lógica do faturamento.tsx
        const fatRes = await fetch(`/api/faturamento?inicio=${inicio}&fim=${fim}`)
        const faturamentos: Faturamento[] = await fatRes.json()
        const totalFaturamento = faturamentos.reduce((sum, f) =>
          sum + (f.total || f.valorHospedagem || f.valorComanda || 0), 0
        )

        // 2. Despesas
        const despesasRes = await fetch(`/api/despesas?inicio=${inicio}&fim=${fim}`)
        const despesasLista: Despesa[] = await despesasRes.json()
        const totalDespesas = despesasLista.reduce((sum, d) => sum + d.valor, 0)

        setFaturamento(totalFaturamento)
        setDespesas(totalDespesas)
      } catch (err) {
        alert('Erro ao buscar dados do servidor.')
      } finally {
        setLoading(false)
      }
    }
    fetchDados()
  }, [inicio, fim])

  const lucro = faturamento - despesas

  return (
    <Layout title="📈 Lucro">
      <div className="max-w-2xl mx-auto px-2 py-8 text-black">
        {/* Filtros em Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <TabBtn text="Hoje"        active={selectedTab === 'hoje'}      onClick={() => { filtrosRapidos.hoje(); setModo('rapido') }}        icon="📅" />
          <TabBtn text="Últimos 7"   active={selectedTab === 'ultimos7'}  onClick={() => { filtrosRapidos.ultimos7(); setModo('rapido') }}   icon="🗓️" />
          <TabBtn text="Mês Atual"   active={selectedTab === 'mes'}       onClick={() => { filtrosRapidos.mes(); setModo('rapido') }}        icon="📆" />
          <TabBtn text="Ano Atual"   active={selectedTab === 'ano'}       onClick={() => { filtrosRapidos.ano(); setModo('rapido') }}        icon="📈" />
          <TabBtn text="Personalizado" active={modo === 'personalizado'}  onClick={() => setModo('personalizado')}                           icon="⚙️" />
        </div>

        {/* Campo de data customizado */}
        {modo === 'personalizado' && (
          <div className="flex gap-4 mb-8 items-end flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data de Início</label>
              <input
                type="date"
                value={inicio.slice(0,10)}
                onChange={e => setInicio(new Date(e.target.value).toISOString())}
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data de Fim</label>
              <input
                type="date"
                value={fim.slice(0,10)}
                onChange={e => setFim(new Date(e.target.value).toISOString())}
                className="w-full border rounded-lg px-3 py-2 text-black"
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

        {/* Card Lucro */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow p-8 flex flex-col items-center space-y-5">
          <ResumoRow
            label="Faturamento"
            icon="💰"
            value={real(faturamento)}
            color="text-blue-700"
            bg="bg-blue-100"
          />
          <ResumoRow
            label="Despesas"
            icon="📉"
            value={real(despesas)}
            color="text-red-700"
            bg="bg-red-100"
          />
          <ResumoRow
            label="Lucro"
            icon="🧾"
            value={real(lucro)}
            color={lucro >= 0 ? 'text-green-700' : 'text-red-700'}
            bg={lucro >= 0 ? 'bg-green-100' : 'bg-red-100'}
            valueClass="text-2xl"
          />
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 mt-2 animate-pulse">
              <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-400 animate-spin inline-block"></span>
              Carregando...
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function TabBtn({ text, active, onClick, icon }: { text: string, active: boolean, onClick: () => void, icon?: string }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition 
        ${active
          ? 'bg-blue-600 text-white border-blue-700 shadow'
          : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
      onClick={onClick}
      type="button"
    >
      {icon && <span className="bg-white text-xl rounded-full">{icon}</span>}
      {text}
    </button>
  )
}

function ResumoRow({
  label,
  icon,
  value,
  color,
  bg,
  valueClass = '',
}: {
  label: string
  icon: string
  value: string
  color: string
  bg: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-3 w-full justify-between">
      <span className="flex items-center gap-2 font-medium">
        <span className={`rounded-full p-2 text-xl ${bg}`}>{icon}</span>
        {label}
      </span>
      <span className={`${color} font-bold ${valueClass}`}>{value}</span>
    </div>
  )
}
