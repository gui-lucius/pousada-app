import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { useEffect, useState } from 'react'
import { useApenasAdmin } from '@/utils/proteger'
import { db } from '@/utils/db'

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

  useEffect(() => {
    db.precos.get('config').then((dados) => {
      if (!dados) return

      setHospedagem({
        individual: dados.hospedagem.individual ?? { comCafe: 0, semCafe: 0 },
        casal: dados.hospedagem.casal ?? { comCafe: 0, semCafe: 0 },
        tresPessoas: dados.hospedagem.tresPessoas ?? { comCafe: 0, semCafe: 0 },
        quatroPessoas: dados.hospedagem.quatroPessoas ?? { comCafe: 0, semCafe: 0 },
        maisQuatro: dados.hospedagem.maisQuatro ?? { comCafe: 0, semCafe: 0 },
        criancas: dados.hospedagem.criancas ?? {
          de0a3Gratuito: true,
          de4a9: 0,
          aPartir10: 'adulto'
        }
      })

      setCategoriasExtras(dados.categoriasExtras || {})
    })
  }, [])


  const salvar = async () => {
    await db.precos.put({
      id: 'config',
      hospedagem,
      restaurante: { almocoBuffet: 0, almocoTradicional: 0, descontoGeral: 0 },
      produtos: { porPeso: [], unitarios: [] },
      servicos: [],
      jantar: [],
      categoriasExtras,
      updatedAt: Date.now()
    })
    alert('Preços salvos com sucesso!')
  }

  const labelPorTipo: Record<HospedagemTipo, string> = {
    individual: 'Individual',
    casal: 'Casal',
    tresPessoas: '3 pessoas',
    quatroPessoas: '4 pessoas',
    maisQuatro: '+4 pessoas'
  }

  const renderCategoria = () => {
    if (categoria === 'hospedagem') {
      return (
        <section>
          <h2 className="text-2xl font-bold mb-4">🏨 Hospedagem</h2>
          {(
            [
              'individual',
              'casal',
              'tresPessoas',
              'quatroPessoas',
              'maisQuatro'
            ] as const
          ).map((tipo) => (
            <div key={tipo} className="mb-4">
              <h3 className="font-semibold text-lg">{labelPorTipo[tipo]}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Com café"
                  type="number"
                  prefixoMonetario
                  value={hospedagem[tipo].comCafe}
                  onChange={(e) =>
                    setHospedagem({
                      ...hospedagem,
                      [tipo]: {
                        ...hospedagem[tipo],
                        comCafe: Number(e.target.value)
                      }
                    })
                  }
                />
                <Input
                  label="Sem café"
                  type="number"
                  prefixoMonetario
                  value={hospedagem[tipo].semCafe}
                  onChange={(e) =>
                    setHospedagem({
                      ...hospedagem,
                      [tipo]: {
                        ...hospedagem[tipo],
                        semCafe: Number(e.target.value)
                      }
                    })
                  }
                />
              </div>
            </div>
          ))}

          <hr className="my-6" />
          <h3 className="text-xl font-bold mb-2">👶 Crianças</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hospedagem.criancas.de0a3Gratuito}
                onChange={(e) =>
                  setHospedagem({
                    ...hospedagem,
                    criancas: {
                      ...hospedagem.criancas,
                      de0a3Gratuito: e.target.checked
                    }
                  })
                }
              />
              Até 3 anos não paga
            </label>

            <Input
              label="4 a 9 anos (valor)"
              type="number"
              prefixoMonetario
              value={hospedagem.criancas.de4a9}
              onChange={(e) =>
                setHospedagem({
                  ...hospedagem,
                  criancas: {
                    ...hospedagem.criancas,
                    de4a9: Number(e.target.value)
                  }
                })
              }
            />
          </div>
        </section>
      )
    }

    if (categoriasExtras[categoria]) {
      return (
        <section>
          <h2 className="text-2xl font-bold mb-4">
            {categoriasExtras[categoria].emoji} {categoria}
          </h2>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoriasExtras[categoria].usarEmComanda || false}
                onChange={(e) => {
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: {
                      ...categoriasExtras[categoria],
                      usarEmComanda: e.target.checked
                    }
                  })
                }}
              />
              Usar essa categoria na comanda?
            </label>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoriasExtras[categoria].porKg || false}
                onChange={(e) => {
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: {
                      ...categoriasExtras[categoria],
                      porKg: e.target.checked,
                    },
                  });
                }}
              />
              Esta categoria é por KG?
            </label>
          </div>


          <div className="space-y-2">
            {categoriasExtras[categoria].itens.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_130px_40px] items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder="Nome"
                  value={item.nome}
                  onChange={(e) => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos[i].nome = e.target.value
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: {
                        ...categoriasExtras[categoria],
                        itens: novos
                      }
                    })
                  }}
                />
                <Input
                  type="number"
                  prefixoMonetario
                  placeholder="Preço"
                  value={item.preco}
                  onChange={(e) => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos[i].preco = Number(e.target.value)
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: {
                        ...categoriasExtras[categoria],
                        itens: novos
                      }
                    })
                  }}
                />
                <button
                  onClick={() => {
                    const novos = [...categoriasExtras[categoria].itens]
                    novos.splice(i, 1)
                    setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: {
                        ...categoriasExtras[categoria],
                        itens: novos
                      }
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
                  const novos = [
                    ...categoriasExtras[categoria].itens,
                    { nome: '', preco: 0 }
                  ]
                  setCategoriasExtras({
                    ...categoriasExtras,
                    [categoria]: {
                      ...categoriasExtras[categoria],
                      itens: novos
                    }
                  })
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
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
      <div className="max-w-3xl mx-auto text-black space-y-10">
        <div className="bg-white border shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-800">🎛️ Painel de Categorias</h2>

            <button
              onClick={() => {
                const nome = prompt('Digite o nome da nova categoria:')
                if (!nome || categoriasExtras[nome]) return
                const emoji =
                  prompt('Escolha um emoji para essa categoria (ex: 🍺):') || '🆕'
                setCategoriasExtras({
                  ...categoriasExtras,
                  [nome]: { emoji, itens: [] }
                })
                setCategoria(nome)
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              ➕ Nova Categoria
            </button>

            {categoria in categoriasExtras && (
              <button
                onClick={() => {
                  if (confirm(`Excluir a categoria "${categoria}"?`)) {
                    const copia = { ...categoriasExtras }
                    delete copia[categoria]
                    setCategoriasExtras(copia)
                    setCategoria('hospedagem')
                  }
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                ❌ Excluir Categoria
              </button>
            )}
          </div>

          <label className="block text-gray-700 mb-1 font-medium">
            Escolha uma categoria:
          </label>
          <select
            className="border border-gray-300 rounded px-4 py-2 w-full text-black"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="hospedagem">🏨 Hospedagem</option>
            {Object.entries(categoriasExtras).map(([cat, data]) => (
              <option key={cat} value={cat}>
                {data.emoji} {cat}
              </option>
            ))}
          </select>
        </div>

        {renderCategoria()}

        <div className="text-center pt-6">
          <Botao texto="Salvar Preços" onClick={salvar} />
        </div>
      </div>
    </Layout>
  )
}
