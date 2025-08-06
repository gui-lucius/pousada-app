'use client'

import Layout from '@/components/layout/Layout'
import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, isValid } from 'date-fns'

type Faturamento = {
  id: string
  tipo: string
  nomeHospede?: string
  chale?: string
  valorHospedagem?: number
  valorComanda?: number
  total?: number
  criadoEm: string
  formaPagamento: string
  itensComanda?: any
}

function real(n: number) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    style: 'currency',
    currency: 'BRL'
  })
}

function formatPeriodo(inicio: string, fim: string) {
  if (!inicio || !fim) return ''
  const d1 = parseISO(inicio)
  const d2 = parseISO(fim)
  if (!isValid(d1) || !isValid(d2)) return ''
  return inicio === fim
    ? format(d1, 'dd/MM/yyyy')
    : `${format(d1, 'dd/MM/yyyy')} — ${format(d2, 'dd/MM/yyyy')}`
}

export default function FaturamentoPage() {
  // Estados de input
  const [inicioInput, setInicioInput] = useState('')
  const [fimInput, setFimInput] = useState('')
  // Estado que vai pra query
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  const [selectedTab, setSelectedTab] = useState<'hoje'|'ultimos7'|'mes'|'ano'|'personalizado'>('hoje')
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string|null>(null)

  // Função unificada de fetch
  const buscar = useCallback(async () => {
    if (!inicio || !fim) return
    setErro(null)
    setCarregando(true)
    try {
      const params = new URLSearchParams({ inicio, fim })
      const res = await fetch(`/api/faturamento?${params.toString()}`)
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setFaturamentos(data)
    } catch (e: any) {
      console.error('Erro ao buscar faturamentos:', e)
      setErro('Não foi possível carregar os dados. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [inicio, fim])

  // Inicializa com “Hoje”
  useEffect(() => {
    filtrosRapidos.hoje()
  }, [])

  // Chama buscar quando a dupla (inicio, fim) oficial mudar
  useEffect(() => {
    buscar()
  }, [buscar])

  // Presets de filtro
  const filtrosRapidos = {
    hoje: () => {
      const d1 = new Date(); d1.setHours(0,0,0,0)
      const d2 = new Date(); d2.setHours(23,59,59,999)
      setInicio(d1.toISOString()); setFim(d2.toISOString())
      setInicioInput(d1.toISOString().slice(0,10))
      setFimInput(d2.toISOString().slice(0,10))
      setSelectedTab('hoje')
    },
    ultimos7: () => {
      const d2 = new Date(); d2.setHours(23,59,59,999)
      const d1 = new Date(d2); d1.setDate(d2.getDate()-6); d1.setHours(0,0,0,0)
      setInicio(d1.toISOString()); setFim(d2.toISOString())
      setInicioInput(d1.toISOString().slice(0,10))
      setFimInput(d2.toISOString().slice(0,10))
      setSelectedTab('ultimos7')
    },
    mes: () => {
      const now = new Date()
      const d1 = new Date(now.getFullYear(), now.getMonth(), 1); d1.setHours(0,0,0,0)
      const d2 = new Date(now.getFullYear(), now.getMonth()+1, 0); d2.setHours(23,59,59,999)
      setInicio(d1.toISOString()); setFim(d2.toISOString())
      setInicioInput(d1.toISOString().slice(0,10))
      setFimInput(d2.toISOString().slice(0,10))
      setSelectedTab('mes')
    },
    ano: () => {
      const ano = new Date().getFullYear()
      const d1 = new Date(ano,0,1); d1.setHours(0,0,0,0)
      const d2 = new Date(ano,11,31); d2.setHours(23,59,59,999)
      setInicio(d1.toISOString()); setFim(d2.toISOString())
      setInicioInput(d1.toISOString().slice(0,10))
      setFimInput(d2.toISOString().slice(0,10))
      setSelectedTab('ano')
    }
  }

  return (
    <Layout title="📊 Faturamento">
      <div className="max-w-4xl mx-auto px-2 py-8 text-black">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <TabBtn text="Hoje" active={selectedTab==='hoje'} onClick={filtrosRapidos.hoje} icon="📅" />
          <TabBtn text="Últimos 7" active={selectedTab==='ultimos7'} onClick={filtrosRapidos.ultimos7} icon="🗓️" />
          <TabBtn text="Mês Atual" active={selectedTab==='mes'} onClick={filtrosRapidos.mes} icon="📆" />
          <TabBtn text="Ano Atual" active={selectedTab==='ano'} onClick={filtrosRapidos.ano} icon="📈" />
          <TabBtn text="Personalizado" active={selectedTab==='personalizado'} onClick={()=>setSelectedTab('personalizado')} icon="⚙️" />
        </div>

        {/* Filtro personalizado */}
        {selectedTab === 'personalizado' && (
          <div className="flex gap-4 mb-4 items-end flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Início</label>
              <input
                type="date"
                value={inicioInput}
                onChange={e=> setInicioInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Fim</label>
              <input
                type="date"
                value={fimInput}
                onChange={e=> setFimInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold"
              onClick={() => {
                // Só atualiza o fetch quando clicar aqui
                const d1 = new Date(inicioInput)
                d1.setHours(0,0,0,0)
                const d2 = new Date(fimInput)
                d2.setHours(23,59,59,999)
                setInicio(d1.toISOString())
                setFim(d2.toISOString())
              }}
            >
              Filtrar
            </button>
          </div>
        )}

        {/* Período e Resumo */}
        <div className="mb-6 text-center text-lg font-medium text-blue-900">
          <span className="bg-blue-50 px-4 py-1 rounded-full">
            Período: {formatPeriodo(inicio, fim)}
          </span>
        </div>

        {/* Indicadores */}
        <div className="flex flex-wrap gap-6 justify-center mb-8">
          <ResumoCard label="Hospedagem" value={real(
            faturamentos
              .filter(f=>f.tipo==='hospedagem')
              .reduce((s,f)=> s + (f.valorHospedagem||0),0)
          )} icon="🏨" color="text-blue-700" bg="bg-blue-100"/>

          <ResumoCard label="Comandas" value={real(
            faturamentos
              .filter(f=>f.tipo!=='hospedagem')
              .reduce((s,f)=> s + (f.valorComanda||0),0)
          )} icon="🧾" color="text-green-700" bg="bg-green-100"/>

          <ResumoCard label="Total Geral" value={real(
            faturamentos
              .reduce((s,f)=> s + (f.total||f.valorHospedagem||f.valorComanda||0),0)
          )} icon="💰" color="text-purple-700" bg="bg-purple-100" valueClass="text-xl"/>
        </div>

        {/* Tabela */}
        <div className="bg-white border shadow rounded-xl p-4">
          <div className="font-bold text-lg mb-3 text-blue-900">Lançamentos</div>
          {erro && <div className="p-4 bg-red-100 text-red-800 mb-4">{erro}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Hospede/Chalé</th>
                  <th className="p-2 text-left">Valor</th>
                  <th className="p-2 text-left">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {carregando && (
                  <tr><td colSpan={5} className="py-8 text-center text-blue-600 animate-pulse">Carregando...</td></tr>
                )}
                {!carregando && faturamentos.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum lançamento.</td></tr>
                )}
                {!carregando && faturamentos.map(f => (
                  <tr key={f.id} className="border-b">
                    <td className="p-2">{format(parseISO(f.criadoEm), 'dd/MM/yyyy')}</td>
                    <td className="p-2 font-bold">{f.tipo}</td>
                    <td className="p-2">
                      {f.nomeHospede || '-'} <span className="text-xs bg-gray-100 text-gray-600 rounded px-1">{f.chale}</span>
                    </td>
                    <td className="p-2 font-medium text-blue-800">
                      {real(f.total||f.valorHospedagem||f.valorComanda||0)}
                    </td>
                    <td className="p-2">{f.formaPagamento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function TabBtn({ text, active, onClick, icon }: { text:string, active:boolean, onClick:()=>void, icon?:string }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition 
        ${active ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'}
      `}
      onClick={onClick}
      type="button"
    >
      {icon && <span className="text-xl">{icon}</span>}
      {text}
    </button>
  )
}

function ResumoCard({ label, value, icon, color, bg, valueClass=''}: {
  label:string, value:string, icon:string, color:string, bg:string, valueClass?:string
}) {
  return (
    <div className={`flex flex-col items-center rounded-2xl p-5 shadow border min-w-[150px] ${bg}`}>
      <span className="text-3xl mb-1">{icon}</span>
      <span className="font-bold text-sm text-gray-700">{label}</span>
      <span className={`font-bold text-lg ${color} ${valueClass}`}>{value}</span>
    </div>
  )
}
