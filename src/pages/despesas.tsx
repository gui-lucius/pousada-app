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

// Data BR bonito para listagem
function formatarDataBr(dt: string) {
  if (!dt) return ''
  if (dt.includes('T')) dt = dt.split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}/.test(dt)) {
    const [ano, mes, dia] = dt.split('-')
    return `${dia}/${mes}/${ano}`
  }
  try {
    const d = new Date(dt)
    if (!isNaN(+d)) return d.toLocaleDateString('pt-BR')
  } catch {}
  return dt
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

  // Mantém as categorias criadas pelo usuário localmente
  const [categoriasLocais, setCategoriasLocais] = useState<string[]>([])

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line
  }, [])

  async function carregarDados() {
    const res = await fetch('/api/despesas')
    const docs: Despesa[] = await res.json()
    setDespesas(docs)
    // Junta as do banco e do local para mostrar todas
    const nomesDasDespesas = docs.map(d => d.categoria)
    const todasCategorias = Array.from(new Set([...nomesDasDespesas, ...categoriasLocais]))
    setCategorias(todasCategorias.map(nome => ({ nome })))
  }

  // Sempre que muda despesas, mantém categoriasLocais atualizadas
  useEffect(() => {
    const nomes = despesas.map(d => d.categoria)
    setCategoriasLocais(prev => prev.filter(cat => !nomes.includes(cat)))
    // eslint-disable-next-line
  }, [despesas])

  function adicionarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome) return
    if (categorias.some(c => c.nome === nome)) return
    setCategorias([...categorias, { nome }])
    setCategoriasLocais([...categoriasLocais, nome])
    setInputsPorCategoria(prev => ({
      ...prev,
      [nome]: { nome: '', valor: '', data: new Date().toISOString().split('T')[0] }
    }))
    setNovaCategoria('')
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
    setCategoriasLocais(categoriasLocais.filter(nome => nome !== catNome))
    await carregarDados()
  }

  function editarItem(item: Despesa) {
    setEditandoId(item.id)
    setInputsPorCategoria(prev => ({
      ...prev,
      [item.categoria]: {
        nome: item.nome,
        valor: item.valor.toString(),
        data: item.data
      }
    }))
  }

  async function salvarItem(categoriaNome: string) {
    const input = inputsPorCategoria[categoriaNome]
    if (!input?.nome || !input?.valor || !input?.data) return

    if (editandoId) {
      await fetch('/api/despesas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId,
          nome: input.nome,
          valor: Number(input.valor),
          data: input.data,
          categoria: categoriaNome
        })
      })
      setEditandoId(null)
    } else {
      await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: input.nome,
          valor: Number(input.valor),
          data: input.data,
          categoria: categoriaNome
        })
      })
    }

    // Remover categoria local caso adicione a primeira despesa (passa a ser persistida)
    setCategoriasLocais(categoriasLocais.filter(nome => nome !== categoriaNome))
    await carregarDados()
    setInputsPorCategoria(prev => ({
      ...prev,
      [categoriaNome]: { nome: '', valor: '', data: new Date().toISOString().split('T')[0] }
    }))
  }

  function cancelarEdicao() {
    setEditandoId(null)
  }

  async function removerItem(id: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    await fetch('/api/despesas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await carregarDados()
  }

  const despesasPorCategoria = (catNome: string) =>
    despesas.filter(d => d.categoria === catNome)

  const categoriasFiltradas = categorias.filter(cat =>
    cat.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <Layout title="Despesas">
      <div className="max-w-4xl mx-auto text-black space-y-10 px-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span role="img" aria-label="despesa">📉</span>
            Despesas da Pousada
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
              {despesas.length}
            </span>
          </h2>
          <button
            onClick={() => window.location.href = '/relatorio-despesas'}
            className="bg-white border border-blue-600 text-blue-600 px-4 py-1 rounded hover:bg-blue-600 hover:text-white transition"
          >
            📊 Ver Relatório
          </button>
        </div>

        <div className="border rounded-xl p-4 space-y-4 shadow bg-white">
          <h3 className="text-lg font-semibold">🔍 Filtrar Categorias</h3>
          <Input placeholder="Buscar categoria..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>

        <div className="border rounded-xl p-4 space-y-3 shadow bg-white">
          <h3 className="text-lg font-semibold mb-2">➕ Nova Categoria</h3>
          <div className="flex gap-2">
            <Input placeholder="Ex: Manutenção" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} />
            <Botao texto="Adicionar" onClick={adicionarCategoria} />
          </div>
        </div>

        <div className="space-y-6">
        {categoriasFiltradas.map(cat => {
          const input = inputsPorCategoria[cat.nome] || {
            nome: '',
            valor: '',
            data: new Date().toISOString().split('T')[0]
          }
          const lista = despesasPorCategoria(cat.nome)
          const totalCategoria = lista.reduce((sum, i) => sum + i.valor, 0)

          return (
            <div key={cat.nome} className="rounded-xl shadow bg-white border border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span role="img" aria-label="cat">📁</span>
                  {cat.nome}
                  <span className="bg-gray-100 text-gray-600 rounded px-2 py-0.5 text-xs ml-2">{lista.length} itens</span>
                  <span className="bg-orange-100 text-orange-700 rounded px-2 py-0.5 text-xs ml-2">Total: R$ {totalCategoria.toFixed(2)}</span>
                </h3>
                <button
                  onClick={() => excluirCategoria(cat.nome)}
                  className="text-red-600 text-xs font-semibold hover:underline"
                >
                  Excluir Categoria
                </button>
              </div>

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
            </div>
          )
        })}
        </div>
      </div>
    </Layout>
  )
}
