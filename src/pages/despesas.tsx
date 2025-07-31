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

export default function DespesasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [filtro, setFiltro] = useState('')
  const [inputsPorCategoria, setInputsPorCategoria] = useState<
    Record<string, { nome: string; valor: string; data: string }>
  >({})
  const [editandoId, setEditandoId] = useState<string | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const res = await fetch('/api/despesas')
    const docs: Despesa[] = await res.json()
    setDespesas(docs)
    const categoriasUnicas = Array.from(new Set(docs.map(d => d.categoria)))
    setCategorias(categoriasUnicas.map(nome => ({ nome })))
  }

  function adicionarCategoria() {
    if (!novaCategoria.trim()) return
    if (categorias.find(c => c.nome === novaCategoria)) return
    setCategorias([...categorias, { nome: novaCategoria }])
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
          valor: input.valor,
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
          valor: input.valor,
          data: input.data,
          categoria: categoriaNome
        })
      })
    }

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
      <div className="max-w-3xl mx-auto text-black space-y-10">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">📉 Despesas da Pousada</h2>
          <button
            onClick={() => window.location.href = '/relatorio-despesas'}
            className="bg-white border border-blue-600 text-blue-600 px-4 py-1 rounded hover:bg-blue-600 hover:text-white transition"
          >
            📊 Ver Relatório
          </button>
        </div>

        <div className="border rounded p-4 space-y-4">
          <h3 className="text-lg font-semibold">🔍 Filtrar Categorias</h3>
          <Input placeholder="Buscar categoria..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>

        <div className="border rounded p-4 space-y-3">
          <h3 className="text-lg font-semibold mb-2">➕ Nova Categoria</h3>
          <div className="flex gap-2">
            <Input placeholder="Ex: Manutenção" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} />
            <Botao texto="Adicionar" onClick={adicionarCategoria} />
          </div>
        </div>

        {categoriasFiltradas.map(cat => {
          const input = inputsPorCategoria[cat.nome] || {
            nome: '',
            valor: '',
            data: new Date().toISOString().split('T')[0]
          }
          const lista = despesasPorCategoria(cat.nome)

          return (
            <div key={cat.nome} className="border rounded p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">📁 {cat.nome}</h3>
                <button onClick={() => excluirCategoria(cat.nome)} className="text-red-500 text-sm">Excluir Categoria</button>
              </div>

              {lista.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum item adicionado ainda.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {lista.map(item => (
                    <li key={item.id} className="flex justify-between items-center">
                      <span>
                        • {item.nome} — R$ {item.valor.toFixed(2)} — {item.data}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => editarItem(item)} className="text-blue-600 text-sm">Editar</button>
                        <button onClick={() => removerItem(item.id)} className="text-red-500 text-sm">Excluir</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
    </Layout>
  )
}
