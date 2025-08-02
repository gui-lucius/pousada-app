import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { useEffect, useState } from 'react'

type Despesa = {
  id: string
  nome: string
  valor: number
  categoria: string
  data: string
}

type Categoria = {
  nome: string
}

function formatarDataBr(dt: string) {
  if (!dt) return ''
  const d = new Date(dt)
  return !isNaN(+d) ? d.toLocaleDateString('pt-BR') : dt
}

export default function DespesasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [filtro, setFiltro] = useState('')
  const [inputsPorCategoria, setInputsPorCategoria] = useState<
    Record<string, { nome: string; valor: string; data: string }>
  >({})
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  useEffect(() => { carregarDados() }, [])
  async function carregarDados() {
    setCarregando(true)
    try {
      const res = await fetch('/api/despesas')
      const docs: Despesa[] = await res.json()
      setDespesas(docs)
      const nomesDasDespesas = docs.map(d => d.categoria)
      const todasCategorias = Array.from(new Set(nomesDasDespesas))
      setCategorias(todasCategorias.map(nome => ({ nome })))
    } catch {
      setFeedback('Erro ao carregar despesas')
    }
    setCarregando(false)
  }

  function adicionarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome || categorias.some(c => c.nome === nome)) return
    setCategorias([...categorias, { nome }])
    setNovaCategoria('')
    setFeedback(null)
  }

  async function excluirCategoria(catNome: string) {
    if (!confirm('Excluir essa categoria e todas as despesas?')) return
    const despesasParaExcluir = despesas.filter(d => d.categoria === catNome)
    for (const d of despesasParaExcluir) {
      await fetch('/api/despesas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: d.id })
      })
    }
    await carregarDados()
    setFeedback(`Categoria "${catNome}" removida`)
    if (categoriaAberta === catNome) setCategoriaAberta(null)
  }

  function editarItem(item: Despesa) {
    setEditandoId(item.id)
    setInputsPorCategoria(prev => ({
      ...prev,
      [item.categoria]: {
        nome: item.nome,
        valor: item.valor.toString(),
        data: item.data.split('T')[0], // input[type="date"]
      }
    }))
    setFeedback(null)
    setCategoriaAberta(item.categoria)
  }

  async function salvarItem(categoriaNome: string) {
    const input = inputsPorCategoria[categoriaNome]
    if (!input?.nome || !input?.valor || !input?.data) return

    const dataISO = new Date(input.data).toISOString()
    if (editandoId) {
      await fetch('/api/despesas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId,
          nome: input.nome,
          valor: Number(input.valor),
          data: dataISO,
          categoria: categoriaNome
        })
      })
      setEditandoId(null)
      setFeedback('Despesa atualizada!')
    } else {
      await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: input.nome,
          valor: Number(input.valor),
          data: dataISO,
          categoria: categoriaNome
        })
      })
      setFeedback('Despesa adicionada!')
    }
    await carregarDados()
    setInputsPorCategoria(prev => ({
      ...prev,
      [categoriaNome]: { nome: '', valor: '', data: new Date().toISOString().split('T')[0] }
    }))
  }

  function cancelarEdicao() { setEditandoId(null) }
  async function removerItem(id: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    await fetch('/api/despesas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await carregarDados()
    setFeedback('Despesa excluída!')
  }

  const despesasPorCategoria = (catNome: string) =>
    despesas.filter(d => d.categoria === catNome)
  const categoriasFiltradas = categorias.filter(cat =>
    cat.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <Layout title="Despesas">
      <div className="max-w-4xl mx-auto text-black space-y-10 px-2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2 text-blue-800">
            <span role="img" aria-label="despesa">📉</span>
            Despesas da Pousada
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
              {despesas.length}
            </span>
          </h2>
          <button
            onClick={() => window.location.href = '/relatorio-despesas'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow transition"
          >
            📊 Relatório
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <Input placeholder="🔍 Buscar categoria..." value={filtro} onChange={e => setFiltro(e.target.value)} />
          <div className="flex gap-2 items-center">
            <Input placeholder="Nova categoria" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} />
            <Botao texto="Adicionar" onClick={adicionarCategoria} />
          </div>
        </div>

        {carregando && <div className="p-2 text-blue-600 text-center">Carregando...</div>}
        {feedback && <div className="bg-green-100 border border-green-200 px-3 py-2 rounded text-green-800 text-center">{feedback}</div>}

        <div className="space-y-6">
          {categoriasFiltradas.length === 0 && (
            <div className="text-gray-500 text-center py-8">Nenhuma categoria encontrada.</div>
          )}
          {categoriasFiltradas.map(cat => {
            const input = inputsPorCategoria[cat.nome] || {
              nome: '',
              valor: '',
              data: new Date().toISOString().split('T')[0]
            }
            const lista = despesasPorCategoria(cat.nome)
            const totalCategoria = lista.reduce((sum, i) => sum + i.valor, 0)
            const aberta = categoriaAberta === cat.nome

            return (
              <div key={cat.nome} className="rounded-xl shadow bg-white border border-gray-200 p-6 space-y-4">
                <div className="flex justify-between items-center mb-2 cursor-pointer"
                  onClick={() => setCategoriaAberta(aberta ? null : cat.nome)}>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="transition-transform">{aberta ? '▼' : '▶'}</span>
                    <span role="img" aria-label="cat">📁</span>
                    {cat.nome}
                    <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5 text-xs ml-2">{lista.length} itens</span>
                    <span className="bg-orange-100 text-orange-700 rounded px-2 py-0.5 text-xs ml-2 font-semibold">Total: R$ {totalCategoria.toFixed(2)}</span>
                  </h3>
                  <button
                    onClick={e => { e.stopPropagation(); excluirCategoria(cat.nome) }}
                    className="text-red-600 text-xs font-semibold hover:underline"
                  >
                    Excluir Categoria
                  </button>
                </div>

                {aberta && (
                  <>
                  {lista.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum item adicionado ainda.</p>
                  ) : (
                    <ul className="space-y-1">
                      {lista.map(item => (
                        <li key={item.id} className="flex justify-between items-center py-1 border-b last:border-0">
                          <span className="font-medium">
                            <span className="text-gray-700">• {item.nome}</span>
                            <span className="ml-3 bg-gray-50 text-gray-600 rounded px-2 py-0.5 text-xs">R$ {item.valor.toFixed(2)}</span>
                            <span className="ml-2 text-xs text-gray-400">{formatarDataBr(item.data)}</span>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => editarItem(item)} className="text-blue-600 text-xs font-semibold hover:underline">Editar</button>
                            <button onClick={() => removerItem(item.id)} className="text-red-500 text-xs font-semibold hover:underline">Excluir</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                    <Input
                      placeholder="Nome do Item"
                      value={input.nome}
                      onChange={e =>
                        setInputsPorCategoria(prev => ({
                          ...prev,
                          [cat.nome]: { ...input, nome: e.target.value }
                        }))
                      }
                    />
                    <Input
                      placeholder="Valor (R$)"
                      type="number"
                      value={input.valor}
                      onChange={e =>
                        setInputsPorCategoria(prev => ({
                          ...prev,
                          [cat.nome]: { ...input, valor: e.target.value }
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={input.data}
                      onChange={e =>
                        setInputsPorCategoria(prev => ({
                          ...prev,
                          [cat.nome]: { ...input, data: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {editandoId && (
                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        className="text-gray-600 underline"
                      >
                        Cancelar
                      </button>
                    )}
                    <Botao
                      texto={editandoId ? 'Salvar Alterações' : 'Adicionar Item'}
                      onClick={() => salvarItem(cat.nome)}
                    />
                  </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
