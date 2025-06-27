import Layout from '@/components/layout/Layout'
import { useApenasAdmin } from '@/utils/proteger'
import { useEffect, useState } from 'react'

interface Registro {
  data: string
  valor: number
}

function formatarBR(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function FaturamentoPage() {
  useApenasAdmin()

  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [total, setTotal] = useState(0)
  const [modo, setModo] = useState<'rapido' | 'personalizado'>('rapido')

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
    if (!inicio || !fim) return

    const checkouts: Registro[] = JSON.parse(localStorage.getItem('pousada_checkouts') || '[]')
    const consumos: Record<string, Registro[]> = JSON.parse(localStorage.getItem('pousada_consumos') || '{}')

    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)
    dataFim.setHours(23, 59, 59, 999)

    let soma = 0

    checkouts.forEach(item => {
      const data = new Date(item.data)
      if (data >= dataInicio && data <= dataFim) soma += item.valor
    })

    Object.values(consumos).forEach(lista => {
      lista.forEach(consumo => {
        const data = new Date(consumo.data)
        if (data >= dataInicio && data <= dataFim) soma += consumo.valor
      })
    })

    setTotal(soma)
  }, [inicio, fim])

  return (
    <Layout title="Faturamento">
      <div className="max-w-3xl mx-auto space-y-6 px-4">
        {/* Opções de Filtro */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => { filtrosRapidos.hoje(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Hoje</button>
          <button onClick={() => { filtrosRapidos.ultimos7(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Últimos 7 dias</button>
          <button onClick={() => { filtrosRapidos.mes(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Mês Atual</button>
          <button onClick={() => { filtrosRapidos.ano(); setModo('rapido') }} className="bg-blue-600 text-white px-4 py-2 rounded shadow">Ano Atual</button>
          <button onClick={() => setModo('personalizado')} className="bg-gray-300 text-black px-4 py-2 rounded shadow">Personalizado</button>
        </div>

        {/* Data personalizada */}
        {modo === 'personalizado' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Data Início</label>
              <input
                type="date"
                value={inicio}
                onChange={e => setInicio(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Data Fim</label>
              <input
                type="date"
                value={fim}
                onChange={e => setFim(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
              />
            </div>
          </div>
        )}

        {/* Resultado */}
        {inicio && fim && (
          <div className="p-6 border rounded shadow bg-white text-center">
            <p className="text-lg">
              Faturamento de <strong>{formatarBR(inicio)}</strong> até <strong>{formatarBR(fim)}</strong>:
            </p>
            <p className="text-3xl font-bold text-green-600 mt-3">R$ {total.toFixed(2)}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
