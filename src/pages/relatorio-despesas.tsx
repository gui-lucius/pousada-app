import Layout from '@/components/layout/Layout'
import { useEffect, useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Despesa = {
  id: string
  nome: string
  valor: number
  categoria: string
  data: string
}

export default function RelatorioDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState('')
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [abertoPorMes, setAbertoPorMes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const carregar = async () => {
      const res = await fetch('/api/despesas')
      const todas = await res.json()
      setDespesas(todas)
    }
    carregar()
  }, [])

  const getAno = (data: string) => data.slice(0, 4)
  const getMes = (data: string) => data.slice(0, 7)
  const anos = [...new Set(despesas.map(d => getAno(d.data)))].sort()
  const meses = [...new Set(despesas.map(d => getMes(d.data)))].sort()
  const categoriasUnicas = [...new Set(despesas.map(d => d.categoria))]

  const despesasFiltradas = despesas.filter(d => {
    const ano = getAno(d.data)
    const mes = getMes(d.data)
    return (
      (!anoSelecionado || ano === anoSelecionado) &&
      (!mesSelecionado || mes === mesSelecionado) &&
      (!categoriaSelecionada || d.categoria === categoriaSelecionada)
    )
  })

  // Agrupa por mês
  const agrupadasPorMes: Record<string, Despesa[]> = {}
  for (const d of despesasFiltradas) {
    const mes = getMes(d.data)
    if (!agrupadasPorMes[mes]) agrupadasPorMes[mes] = []
    agrupadasPorMes[mes].push(d)
  }

  const totalGeral = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0)

  // Toggle meses abertos/fechados
  const toggleMes = (mes: string) =>
    setAbertoPorMes(prev => ({ ...prev, [mes]: !prev[mes] }))

  return (
    <Layout title="Relatório de Despesas">
      <div className="max-w-4xl mx-auto p-4 text-black space-y-6">
        {/* FILTROS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold flex gap-2 items-center text-blue-900">
            📊 Relatório de Despesas
            <span className="text-base text-blue-700 bg-blue-50 rounded-full px-3 py-1">
              {despesasFiltradas.length} lançamentos
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Ano</label>
              <select
                value={anoSelecionado}
                onChange={e => setAnoSelecionado(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="">Todos</option>
                {anos.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mês</label>
              <select
                value={mesSelecionado}
                onChange={e => setMesSelecionado(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="">Todos</option>
                {meses.map(mes => {
                  const data = parseISO(`${mes}-01`)
                  return (
                    <option key={mes} value={mes}>
                      {isValid(data) ? format(data, 'MM/yyyy', { locale: ptBR }) : mes}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Categoria</label>
              <select
                value={categoriaSelecionada}
                onChange={e => setCategoriaSelecionada(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="">Todas</option>
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="space-y-6">
          {Object.entries(agrupadasPorMes)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([mes, lista]) => {
              const dataValida = parseISO(`${mes}-01`)
              const dataExibida = isValid(dataValida)
                ? format(dataValida, 'MMMM/yyyy', { locale: ptBR })
                : mes
              const totalMes = lista.reduce((s, d) => s + d.valor, 0)
              const porCategoria = lista.reduce((acc, d) => {
                if (!acc[d.categoria]) acc[d.categoria] = []
                acc[d.categoria].push(d)
                return acc
              }, {} as Record<string, Despesa[]>)

              return (
                <div
                  key={mes}
                  className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 shadow border p-5 transition-all"
                >
                  <button
                    onClick={() => toggleMes(mes)}
                    className="w-full flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="text-lg font-bold flex gap-2 items-center">
                      <span>{abertoPorMes[mes] ? '▼' : '▶'}</span>
                      <span>📅 {dataExibida[0].toUpperCase() + dataExibida.slice(1)}</span>
                    </span>
                    <span className="text-xl text-green-800 font-bold bg-green-100 px-4 py-1 rounded-lg">
                      R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </button>

                  {abertoPorMes[mes] && (
                    <div className="mt-3 space-y-3">
                      {Object.entries(porCategoria).map(([categoria, grupo]) => {
                        const total = grupo.reduce((s, d) => s + d.valor, 0)
                        return (
                          <div key={categoria} className="border-l-4 border-purple-300 pl-4 bg-white rounded shadow-sm py-2">
                            <div className="font-semibold text-purple-800 mb-1 flex justify-between items-center">
                              <span>
                                {categoria}
                                <span className="ml-2 text-xs bg-gray-100 text-gray-700 rounded px-2">
                                  {grupo.length} itens
                                </span>
                              </span>
                              <span className="text-purple-700 font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {/* LINHA PROFISSIONAL E SEM QUEBRAR NADA */}
                            <ul className="text-sm text-gray-700">
                              {grupo.map(d => (
                                <li
                                  key={d.id}
                                  className="flex flex-row justify-between items-center py-1 border-b last:border-b-0 gap-2 hover:bg-blue-50 transition"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-gray-500 mr-2">{format(parseISO(d.data), 'dd/MM/yyyy')}</span>
                                    <span className="truncate inline-block max-w-[180px] align-middle">{d.nome}</span>
                                  </div>
                                  <span className="text-blue-700 font-medium whitespace-nowrap min-w-[90px] text-right pl-2">
                                    R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

          {despesasFiltradas.length === 0 && (
            <p className="text-gray-500 mt-4 text-center">
              Nenhuma despesa encontrada com os filtros selecionados.
            </p>
          )}

          <div className="text-right mt-8 font-extrabold text-xl text-green-800">
            💰 Total Geral: R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
