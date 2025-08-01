'use client'

import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { useEffect, useState } from 'react'
import { useApenasAdmin } from '@/utils/proteger'

type HospedagemTipo =
  | 'individual'
  | 'casal'
  | 'tresPessoas'
  | 'quatroPessoas'
  | 'maisQuatro'

type Hospedagem = {
  [key in HospedagemTipo]: { comCafe: number; semCafe: number }
} & {
  criancas: {
    de0a3Gratuito: boolean
    de4a9: number
    aPartir10: 'adulto'
  }
}

type Unitario = { nome: string; preco: number }

type CategoriasExtras = Record<
  string,
  {
    emoji: string
    usarEmComanda?: boolean
    porKg?: boolean
    itens: Unitario[]
  }
>

type PrecosAPI = {
  hospedagem: Hospedagem
  categoriasExtras: CategoriasExtras
}

const labelPorTipo: Record<HospedagemTipo, string> = {
  individual: 'Individual',
  casal: 'Casal',
  tresPessoas: '3 Pessoas',
  quatroPessoas: '4 Pessoas',
  maisQuatro: '+4 Pessoas'
}

export default function PrecosPage() {
  useApenasAdmin()

  const [categoriasExtras, setCategoriasExtras] = useState<CategoriasExtras>({})
  const [categoria, setCategoria] = useState<string>('hospedagem')
  const [hospedagem, setHospedagem] = useState<Hospedagem>({
    individual: { comCafe: 0, semCafe: 0 },
    casal: { comCafe: 0, semCafe: 0 },
    tresPessoas: { comCafe: 0, semCafe: 0 },
    quatroPessoas: { comCafe: 0, semCafe: 0 },
    maisQuatro: { comCafe: 0, semCafe: 0 },
    criancas: {
      de0a3Gratuito: true,
      de4a9: 0,
      aPartir10: 'adulto'
    }
  })
  const [loading, setLoading] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🆕')

  useEffect(() => {
    const fetchPrecos = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/precos')
        if (!res.ok) throw new Error('Erro ao buscar preços')
        const dados: PrecosAPI = await res.json()
        if (dados?.hospedagem) setHospedagem(dados.hospedagem)
        if (dados?.categoriasExtras) setCategoriasExtras(dados.categoriasExtras)
      } catch (err) {
        alert('Erro ao carregar preços. Verifique conexão/API.')
      } finally {
        setLoading(false)
      }
    }
    fetchPrecos()
  }, [])

  const salvar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/precos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospedagem,
          categoriasExtras
        })
      })
      if (!res.ok) throw new Error('Erro ao salvar preços')
      alert('Preços salvos com sucesso!')
    } catch (err) {
      alert('Erro ao salvar preços. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Lado esquerdo: categorias
  function renderSidebar() {
    return (
      <aside className="bg-white rounded-2xl shadow border w-full sm:w-60 min-h-[350px] p-4 flex flex-col gap-2 mb-6 sm:mb-0">
        <button
          onClick={() => setCategoria('hospedagem')}
          className={`flex items-center gap-2 px-3 py-2 rounded font-semibold
            ${categoria === 'hospedagem'
              ? 'bg-blue-600 text-white'
              : 'text-blue-800 hover:bg-blue-100'}
          `}
        >
          🏨 Hospedagem
        </button>
        {Object.entries(categoriasExtras).map(([cat, data]) => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            className={`flex items-center gap-2 px-3 py-2 rounded font-semibold
              ${categoria === cat
                ? 'bg-blue-600 text-white'
                : 'text-blue-800 hover:bg-blue-100'}
            `}
          >
            <span>{data.emoji}</span> {cat}
          </button>
        ))}
        <button
          onClick={() => setShowNewCat(true)}
          className="flex items-center gap-2 mt-4 px-3 py-2 rounded font-semibold bg-green-100 hover:bg-green-200 text-green-900"
        >
          ➕ Nova Categoria
        </button>
      </aside>
    )
  }

  // Modal de nova categoria
  function renderModalNovaCategoria() {
    if (!showNewCat) return null
    return (
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg max-w-xs w-full p-6 flex flex-col gap-4">
          <h2 className="font-bold text-lg mb-2">Adicionar nova categoria</h2>
          <label className="block">
            Emoji:
            <input
              type="text"
              maxLength={2}
              className="border px-2 py-1 rounded ml-2 w-12 text-lg"
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
            />
          </label>
          <Input
            placeholder="Nome da categoria"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setShowNewCat(false)}
              className="text-gray-600 underline"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!newCatName.trim() || categoriasExtras[newCatName]) return
                setCategoriasExtras({
                  ...categoriasExtras,
                  [newCatName]: { emoji: newCatEmoji || '🆕', itens: [] }
                })
                setCategoria(newCatName)
                setShowNewCat(false)
                setNewCatName('')
                setNewCatEmoji('🆕')
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Área principal de edição
  function renderCategoria() {
    if (categoria === 'hospedagem') {
      return (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">🏨 Hospedagem</h2>
          <div className="space-y-5">
            {(['individual', 'casal', 'tresPessoas', 'quatroPessoas', 'maisQuatro'] as const).map((tipo) => (
              <div key={tipo} className="p-4 rounded-xl bg-blue-50 border mb-2">
                <h3 className="font-semibold text-lg mb-2">{labelPorTipo[tipo]}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Com café"
                    type="number"
                    prefixoMonetario
                    value={hospedagem[tipo]?.comCafe ?? 0}
                    onChange={e =>
                      setHospedagem({
                        ...hospedagem,
                        [tipo]: { ...hospedagem[tipo], comCafe: Number(e.target.value) }
                      })
                    }
                  />
                  <Input
                    label="Sem café"
                    type="number"
                    prefixoMonetario
                    value={hospedagem[tipo]?.semCafe ?? 0}
                    onChange={e =>
                      setHospedagem({
                        ...hospedagem,
                        [tipo]: { ...hospedagem[tipo], semCafe: Number(e.target.value) }
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-1">👶 Crianças</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50 rounded-lg border p-4">
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={hospedagem.criancas?.de0a3Gratuito ?? false}
                  onChange={e =>
                    setHospedagem({
                      ...hospedagem,
                      criancas: { ...hospedagem.criancas, de0a3Gratuito: e.target.checked }
                    })
                  }
                />
                Até 3 anos não paga
              </label>
              <Input
                label="4 a 9 anos (valor)"
                type="number"
                prefixoMonetario
                value={hospedagem.criancas?.de4a9 ?? 0}
                onChange={e =>
                  setHospedagem({
                    ...hospedagem,
                    criancas: { ...hospedagem.criancas, de4a9: Number(e.target.value) }
                  })
                }
              />
            </div>
          </div>
        </section>
      )
    }

    if (categoriasExtras[categoria]) {
      return (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{categoriasExtras[categoria].emoji}</span>
            <h2 className="text-2xl font-bold">{categoria}</h2>
            <button
              onClick={() => {
                if (confirm(`Excluir a categoria "${categoria}"?`)) {
                  const copia = { ...categoriasExtras }
                  delete copia[categoria]
                  setCategoriasExtras(copia)
                  setCategoria('hospedagem')
                }
              }}
              className="ml-auto text-red-600 hover:text-red-800 bg-red-50 rounded px-3 py-1 font-bold"
              title="Excluir Categoria"
            >
              Excluir
            </button>
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoriasExtras[categoria].usarEmComanda || false}
                onChange={e =>
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: { ...categoriasExtras[categoria], usarEmComanda: e.target.checked }
                  })
                }
              />
              Usar essa categoria na comanda?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoriasExtras[categoria].porKg || false}
                onChange={e =>
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: { ...categoriasExtras[categoria], porKg: e.target.checked }
                  })
                }
              />
              Esta categoria é por KG?
            </label>
          </div>
          <div className="space-y-2">
            {categoriasExtras[categoria].itens.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_130px_40px] items-center gap-2 bg-gray-50 border rounded-lg p-2"
              >
                <Input
                  type="text"
                  placeholder="Nome"
                  value={item.nome}
                  onChange={e => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos[i].nome = e.target.value
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: { ...categoriasExtras[categoria], itens: novos }
                    })
                  }}
                />
                <Input
                  type="number"
                  prefixoMonetario
                  placeholder="Preço"
                  value={item.preco}
                  onChange={e => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos[i].preco = Number(e.target.value)
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: { ...categoriasExtras[categoria], itens: novos }
                    })
                  }}
                />
                <button
                  onClick={() => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos.splice(i, 1)
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: { ...categoriasExtras[categoria], itens: novos }
                    })
                  }}
                  className="text-pink-600 hover:text-pink-800 text-xl"
                  title="Remover"
                >
                  ❌
                </button>
              </div>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  const novos = [...categoriasExtras[categoria].itens, { nome: '', preco: 0 }]
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: { ...categoriasExtras[categoria], itens: novos }
                  })
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                type="button"
              >
                ➕ Adicionar Item
              </button>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  return (
    <Layout title="Painel de Preços">
      {renderModalNovaCategoria()}
      <div className="max-w-5xl mx-auto px-2 py-8 flex flex-col sm:flex-row gap-8 text-black">
        {/* Sidebar categorias */}
        {renderSidebar()}

        {/* Card de edição */}
        <main className="flex-1 bg-white border rounded-2xl shadow p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Carregando...
            </div>
          ) : (
            renderCategoria()
          )}

          <div className="pt-6 flex justify-end">
            <Botao texto={loading ? 'Salvando...' : 'Salvar Preços'} onClick={salvar} disabled={loading} />
          </div>
        </main>
      </div>
    </Layout>
  )
}
