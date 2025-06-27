// pages/precos.tsx
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { useEffect, useState } from 'react'
import { useApenasAdmin } from '@/utils/proteger'

type HospedagemTipo = 'individual' | 'casal' | 'tresPessoas' | 'maisQuatro'

type Hospedagem = {
  [key in HospedagemTipo]: { comCafe: number; semCafe: number }
} & {
  criancas: {
    de0a3Gratuito: boolean
    de4a9: number
    aPartir10: 'adulto'
  }
  descontoReserva: {
    aplicar: boolean
    percentual: number
    minDiarias: number
  }
}

type Restaurante = {
  almocoTradicional: number
  almocoBuffet: number
  descontoCrianca: number
  descontoBariatrico: number
}

type PorPeso = { nome: string; precoPorKg: number }
type Unitario = { nome: string; preco: number }
type Servico = { nome: string; preco: number }
type JantarItem = { nome: string; preco: number }
type CategoriasExtras = Record<string, Unitario[]>

export default function PrecosPage() {
  useApenasAdmin()

  const [categoriasExtras, setCategoriasExtras] = useState<CategoriasExtras>({})

  const [categoria, setCategoria] = useState<string>('hospedagem')

  const [hospedagem, setHospedagem] = useState<Hospedagem>({
    individual: { comCafe: 0, semCafe: 0 },
    casal: { comCafe: 0, semCafe: 0 },
    tresPessoas: { comCafe: 0, semCafe: 0 },
    maisQuatro: { comCafe: 0, semCafe: 0 },
    criancas: {
      de0a3Gratuito: true,
      de4a9: 0,
      aPartir10: 'adulto'
    },
    descontoReserva: {
      aplicar: false,
      percentual: 0,
      minDiarias: 2
    }
  })

  const [restaurante, setRestaurante] = useState<Restaurante>({
    almocoTradicional: 0,
    almocoBuffet: 0,
    descontoCrianca: 100,
    descontoBariatrico: 50
  })

  const [porPeso, setPorPeso] = useState<PorPeso[]>([])
  const [unitarios, setUnitarios] = useState<Unitario[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [jantar, setJantar] = useState<JantarItem[]>([])

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('pousada_precos')

    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos)

      if (dados.categoriasExtras) setCategoriasExtras(dados.categoriasExtras)

      setHospedagem({
        individual: dados.hospedagem?.individual ?? { comCafe: 0, semCafe: 0 },
        casal: dados.hospedagem?.casal ?? { comCafe: 0, semCafe: 0 },
        tresPessoas: dados.hospedagem?.tresPessoas ?? { comCafe: 0, semCafe: 0 },
        maisQuatro: dados.hospedagem?.maisQuatro ?? { comCafe: 0, semCafe: 0 },
        criancas: dados.hospedagem?.criancas ?? {
          de0a3Gratuito: true,
          de4a9: 0,
          aPartir10: 'adulto'
        },
        descontoReserva: dados.hospedagem?.descontoReserva ?? {
          aplicar: false,
          percentual: 0,
          minDiarias: 2
        }
      })

      if (dados.restaurante) setRestaurante(dados.restaurante)
      if (dados.produtos?.porPeso) setPorPeso(dados.produtos.porPeso)
      if (dados.produtos?.unitarios) setUnitarios(dados.produtos.unitarios)
      if (dados.servicos) setServicos(dados.servicos)
      if (dados.jantar) setJantar(dados.jantar)
    }
  }, [])

  const salvar = () => {
    const dados = {
      hospedagem,
      restaurante,
      produtos: {
        porPeso,
        unitarios
      },
      servicos,
      jantar,
      categoriasExtras
    }
    localStorage.setItem('pousada_precos', JSON.stringify(dados))
    alert('Preços salvos com sucesso!')
  }

  const renderCategoria = () => {
    switch (categoria) {
      case 'hospedagem':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">🏨 Hospedagem</h2>

            {(['individual', 'casal', 'tresPessoas', 'maisQuatro'] as const).map((tipo) => (
              <div key={tipo} className="mb-4">
                <h3 className="font-semibold text-lg capitalize">
                  {tipo === 'individual' ? 'Individual' : tipo === 'casal' ? 'Casal' : tipo === 'tresPessoas' ? '3 Pessoas' : '+4 Pessoas'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Com café" type="number" value={hospedagem[tipo].comCafe}
                    onChange={(e) => setHospedagem({ ...hospedagem, [tipo]: { ...hospedagem[tipo], comCafe: Number(e.target.value) } })} />
                  <Input label="Sem café" type="number" value={hospedagem[tipo].semCafe}
                    onChange={(e) => setHospedagem({ ...hospedagem, [tipo]: { ...hospedagem[tipo], semCafe: Number(e.target.value) } })} />
                </div>
              </div>
            ))}

            <hr className="my-6" />
            <h3 className="text-xl font-bold mb-2">👶 Crianças</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={hospedagem.criancas.de0a3Gratuito}
                  onChange={(e) => setHospedagem({
                    ...hospedagem,
                    criancas: { ...hospedagem.criancas, de0a3Gratuito: e.target.checked }
                  })}
                />
                Até 3 anos não paga
              </label>

              <Input label="4 a 9 anos (valor)" type="number" value={hospedagem.criancas.de4a9}
                onChange={(e) => setHospedagem({
                  ...hospedagem,
                  criancas: { ...hospedagem.criancas, de4a9: Number(e.target.value) }
                })}
              />
            </div>

            <hr className="my-6" />
            <h3 className="text-xl font-bold mb-2">💸 Desconto por Múltiplas Diárias</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={hospedagem.descontoReserva.aplicar}
                  onChange={(e) => setHospedagem({
                    ...hospedagem,
                    descontoReserva: { ...hospedagem.descontoReserva, aplicar: e.target.checked }
                  })}
                />
                Aplicar desconto
              </label>

              <Input label="% Desconto" type="number" value={hospedagem.descontoReserva.percentual}
                onChange={(e) => setHospedagem({
                  ...hospedagem,
                  descontoReserva: { ...hospedagem.descontoReserva, percentual: Number(e.target.value) }
                })}
              />
              <Input label="A partir de quantas diárias?" type="number" value={hospedagem.descontoReserva.minDiarias}
                onChange={(e) => setHospedagem({
                  ...hospedagem,
                  descontoReserva: { ...hospedagem.descontoReserva, minDiarias: Number(e.target.value) }
                })}
              />
            </div>
          </section>
        )

      case 'restaurante':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">🍽️ Restaurante / Refeições</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Almoço Tradicional" type="number" value={restaurante.almocoTradicional}
                onChange={(e) => setRestaurante({ ...restaurante, almocoTradicional: Number(e.target.value) })} />
              <Input label="Almoço Buffet" type="number" value={restaurante.almocoBuffet}
                onChange={(e) => setRestaurante({ ...restaurante, almocoBuffet: Number(e.target.value) })} />
              <Input label="Desconto Criança (%)" type="number" value={restaurante.descontoCrianca}
                onChange={(e) => setRestaurante({ ...restaurante, descontoCrianca: Number(e.target.value) })} />
              <Input label="Desconto Bariátrico (%)" type="number" value={restaurante.descontoBariatrico}
                onChange={(e) => setRestaurante({ ...restaurante, descontoBariatrico: Number(e.target.value) })} />
            </div>
          </section>
        )

      case 'porPeso':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">⚖️ Produtos por Peso (R$/Kg)</h2>
            <div className="space-y-3">
              {porPeso.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <input className="border px-2 py-1 rounded text-black w-48" value={item.nome}
                    onChange={(e) => {
                      const novos = [...porPeso]
                      novos[i].nome = e.target.value
                      setPorPeso(novos)
                    }} />
                  <input type="number" className="border px-2 py-1 rounded w-24 text-black" value={item.precoPorKg}
                    onChange={(e) => {
                      const novos = [...porPeso]
                      novos[i].precoPorKg = Number(e.target.value)
                      setPorPeso(novos)
                    }} />
                  <button onClick={() => {
                    const novos = [...porPeso]
                    novos.splice(i, 1)
                    setPorPeso(novos)
                  }} className="text-red-600 font-bold">❌</button>
                </div>
              ))}
              <button onClick={() => setPorPeso([...porPeso, { nome: '', precoPorKg: 0 }])} className="text-blue-600 underline mt-2">➕ Adicionar Item</button>
            </div>
          </section>
        )

      case 'unitarios':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">📦 Produtos Unitários</h2>
            <div className="space-y-3">
              {unitarios.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <input
                    className="border px-2 py-1 rounded text-black w-48"
                    value={item.nome}
                    onChange={(e) => {
                      const novos = [...unitarios]
                      novos[i].nome = e.target.value
                      setUnitarios(novos)
                    }}
                  />
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-24 text-black"
                    value={item.preco}
                    onChange={(e) => {
                      const novos = [...unitarios]
                      novos[i].preco = Number(e.target.value)
                      setUnitarios(novos)
                    }}
                  />
                  <button
                    onClick={() => {
                      const novos = [...unitarios]
                      novos.splice(i, 1)
                      setUnitarios(novos)
                    }}
                    className="text-red-600 font-bold"
                    title="Remover item"
                  >
                    ❌
                  </button>
                </div>
              ))}

              <button onClick={() => setUnitarios([...unitarios, { nome: '', preco: 0 }])} className="text-blue-600 underline mt-2">➕ Adicionar Item</button>
            </div>
          </section>
        )

      case 'servicos':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">🛠️ Serviços Extras</h2>
            <div className="space-y-3">
              {servicos.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <input className="border px-2 py-1 rounded text-black w-48" value={item.nome}
                    onChange={(e) => {
                      const novos = [...servicos]
                      novos[i].nome = e.target.value
                      setServicos(novos)
                    }} />
                  <input type="number" className="border px-2 py-1 rounded w-24 text-black" value={item.preco}
                    onChange={(e) => {
                      const novos = [...servicos]
                      novos[i].preco = Number(e.target.value)
                      setServicos(novos)
                    }} />
                  <button onClick={() => {
                    const novos = [...servicos]
                    novos.splice(i, 1)
                    setServicos(novos)
                  }} className="text-red-600 font-bold">❌</button>
                </div>
              ))}
              <button onClick={() => setServicos([...servicos, { nome: '', preco: 0 }])} className="text-blue-600 underline mt-2">➕ Adicionar Item</button>
            </div>
          </section>
        )

      case 'jantar':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">🍽️ Jantar / Cardápio</h2>
            <div className="space-y-3">
              {jantar.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <input className="border px-2 py-1 rounded text-black w-64" value={item.nome}
                    onChange={(e) => {
                      const novos = [...jantar]
                      novos[i].nome = e.target.value
                      setJantar(novos)
                    }} />
                  <input type="number" className="border px-2 py-1 rounded w-24 text-black" value={item.preco}
                    onChange={(e) => {
                      const novos = [...jantar]
                      novos[i].preco = Number(e.target.value)
                      setJantar(novos)
                    }} />
                  <button onClick={() => {
                    const novos = [...jantar]
                    novos.splice(i, 1)
                    setJantar(novos)
                  }} className="text-red-600 font-bold">❌</button>
                </div>
              ))}
              <button onClick={() => setJantar([...jantar, { nome: '', preco: 0 }])} className="text-blue-600 underline mt-2">➕ Adicionar Item</button>
            </div>
          </section>
        )
      default:
          if (categoriasExtras[categoria]) {
            return (
              <section>
                <h2 className="text-2xl font-bold mb-4">🆕 {categoria}</h2>
                <div className="space-y-3">
                  {categoriasExtras[categoria].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <input
                        className="border px-2 py-1 rounded text-black w-48"
                        value={item.nome}
                        onChange={(e) => {
                          const novos = [...categoriasExtras[categoria]]
                          novos[i].nome = e.target.value
                          setCategoriasExtras({ ...categoriasExtras, [categoria]: novos })
                        }}
                      />
                      <input
                        type="number"
                        className="border px-2 py-1 rounded w-24 text-black"
                        value={item.preco}
                        onChange={(e) => {
                          const novos = [...categoriasExtras[categoria]]
                          novos[i].preco = Number(e.target.value)
                          setCategoriasExtras({ ...categoriasExtras, [categoria]: novos })
                        }}
                      />
                      <button
                        onClick={() => {
                          const novos = [...categoriasExtras[categoria]]
                          novos.splice(i, 1)
                          setCategoriasExtras({ ...categoriasExtras, [categoria]: novos })
                        }}
                        className="text-red-600 font-bold"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setCategoriasExtras({
                      ...categoriasExtras,
                      [categoria]: [...categoriasExtras[categoria], { nome: '', preco: 0 }]
                    })}
                    className="text-blue-600 underline mt-2"
                  >
                    ➕ Adicionar Item
                  </button>
                </div>
              </section>
            )
          }
          return null
    }
  }

  return (
    <Layout title="Painel de Preços">
      <div className="max-w-3xl mx-auto text-black space-y-10">
        <div className="text-center">
          <label className="block text-lg font-semibold mb-2">Escolha uma categoria:</label>

          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <button
              onClick={() => {
                const nome = prompt('Digite o nome da nova categoria:')
                if (nome && !categoriasExtras[nome]) {
                  setCategoriasExtras({ ...categoriasExtras, [nome]: [] })
                  setCategoria(nome)
                }
              }}
              className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"
            >
              <span className="text-lg">➕</span> Adicionar Nova Categoria
            </button>
          </div>


          <select
            className="border rounded px-4 py-2 text-black"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="hospedagem">🏨 Hospedagem</option>
            <option value="restaurante">🍽️ Restaurante</option>
            <option value="porPeso">⚖️ Produtos por Peso</option>
            <option value="unitarios">📦 Produtos Unitários</option>
            <option value="servicos">🛠️ Serviços Extras</option>
            <option value="jantar">🍽️ Jantar</option>
            {Object.keys(categoriasExtras).map((cat) => (
              <option key={cat} value={cat}>🆕 {cat}</option>
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
