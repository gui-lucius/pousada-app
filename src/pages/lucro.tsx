'use client'

import Layout from '@/components/layout/Layout'
import { useApenasAdmin } from '@/utils/proteger'
import { useEffect, useState } from 'react'

type Checkout = {
  id: string
  valor: number
  dataSaidaReal: string
}
type Despesa = {
  id: string
  valor: number
  data: string
}

export default function LucroPage() {
  useApenasAdmin()

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [modo, setModo] = useState<'rapido' | 'personalizado'>('rapido')
  const [faturamento, setFaturamento] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [loading, setLoading] = useState(false)

  const aplicarFiltro = (inicioStr: string, fimStr: string) => {
    setInicio(inicioStr)
    setFim(fimStr)
  }

  const filtrosRapidos = {
    hoje: () => {
      const hoje = new Date()
      const iso = hoje.toISOString().split('T')[0]
      aplicarFiltro(iso, iso)
    },
    ultimos7: () => {
      const hoje = new Date()
      const sete = new Date()
      sete.setDate(hoje.getDate() - 6)
      aplicarFiltro(sete.toISOString().split('T')[0], hoje.toISOString().split('T')[0])
    },
    mes: () => {
      const agora = new Date()
      const ano = agora.getFullYear()
      const mes = agora.getMonth()
      const inicio = new Date(ano, mes, 1)
      const fim = new Date(ano, mes + 1, 0)
      aplicarFiltro(inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0])
    },
    ano: () => {
      const ano = new Date().getFullYear()
      aplicarFiltro(`${ano}-01-01`, `${ano}-12-31`)
    }
  }

  useEffect(() => {
    filtrosRapidos.hoje()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!inicio || !fim) return
    const fetchDados = async () => {
      setLoading(true)
      try {
        // Busca faturamento (Checkouts)
        const checkoutsRes = await fetch(`/api/checkouts?inicio=${inicio}&fim=${fim}`)
        const checkouts: Checkout[] = await checkoutsRes.json()
        const totalFaturamento = checkouts.reduce((sum, c) => sum + c.valor, 0)

        // Busca despesas
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
      <div className="max-w-3xl mx-auto px-4 space-y-6 text-black">
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
              <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Fim</label>
              <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded shadow border space-y-4 text-lg font-medium">
          <p className="text-blue-700">💰 Faturamento no período: <strong>R$ {faturamento.toFixed(2)}</strong></p>
          <p className="text-red-700">📉 Despesas no período: <strong>R$ {despesas.toFixed(2)}</strong></p>
          <p className={`text-xl ${lucro >= 0 ? 'text-green-700' : 'text-red-700'} font-bold`}>
            🧾 Lucro: R$ {lucro.toFixed(2)}
          </p>
          {loading && <p className="text-gray-500">Carregando...</p>}
        </div>
      </div>
    </Layout>
  )
}
