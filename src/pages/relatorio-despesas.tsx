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

  const agrupadasPorMes: Record<string, Despesa[]> = {}
  for (const d of despesasFiltradas) {
    const mes = getMes(d.data)
    if (!agrupadasPorMes[mes]) agrupadasPorMes[mes] = []
    agrupadasPorMes[mes].push(d)
  }

  const totalGeral = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0)

  return (
    <Layout title="Relatório de Despesas">
      <div className="max-w-4xl mx-auto p-4 text-black space-y-6">
        <h2 className="text-2xl font-bold">📊 Relatório de Despesas</h2>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-4 border p-4 rounded bg-white">
          <div>
            <label className="block text-sm font-medium">Ano</label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="">Todos</option>
              {anos.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Mês</label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
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
            <label className="block text-sm font-medium">Categoria</label>
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="">Todas</option>
              {categoriasUnicas.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-2">🧾 Despesas Filtradas</h3>

          {Object.entries(agrupadasPorMes)
            .sort(([a], [b]) => b.localeCompare(a)) // data desc
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
                <div key={mes} className="border-t pt-4 mt-4 space-y-2">
                  <h4 className="font-bold text-blue-800">📅 {dataExibida}</h4>

                  {Object.entries(porCategoria).map(([categoria, grupo]) => {
                    const total = grupo.reduce((s, d) => s + d.valor, 0)
                    return (
                      <div key={categoria}>
                        <strong className="text-purple-800">{categoria}</strong> — R$ {total.toFixed(2)} ({grupo.length} itens)
                        <ul className="text-sm pl-4 mt-1">
                          {grupo.map(d => (
                            <li key={d.id}>
                              • {format(parseISO(d.data), 'dd/MM/yyyy')} — {d.nome} — R$ {d.valor.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}

                  <div className="text-right font-semibold pt-2">
                    Total do mês: R$ {totalMes.toFixed(2)}
                  </div>
                </div>
              )
            })}

          {despesasFiltradas.length === 0 && (
            <p className="text-gray-500 mt-4">Nenhuma despesa encontrada com os filtros selecionados.</p>
          )}

          <div className="text-right mt-6 font-bold text-lg">
            💰 Total Geral: R$ {totalGeral.toFixed(2)}
          </div>
        </div>
      </div>
    </Layout>
  )
}
