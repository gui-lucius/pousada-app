// pages/consumo.tsx
import Layout from '@/components/layout/Layout'
import Botao from '@/components/ui/Botao'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type ComandaItem = {
  nome: string
  preco: number
  pago: boolean
}

type Comanda = {
  id: string
  cliente: string
  data: string
  itens: ComandaItem[]
  finalizada: boolean
}

export default function ConsumoPage() {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [novoCliente, setNovoCliente] = useState('')
  const [itemNome, setItemNome] = useState('')
  const [itemPreco, setItemPreco] = useState<number>(0)
  const [comandaSelecionada, setComandaSelecionada] = useState<string | null>(null)

  // Carregar do localStorage
  useEffect(() => {
    const armazenadas = localStorage.getItem('comandas')
    if (armazenadas) {
      setComandas(JSON.parse(armazenadas))
    }
  }, [])

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('comandas', JSON.stringify(comandas))
  }, [comandas])

  const criarComanda = () => {
    if (!novoCliente.trim()) return
    const nova: Comanda = {
      id: uuidv4(),
      cliente: novoCliente,
      data: new Date().toISOString(),
      itens: [],
      finalizada: false
    }
    setComandas([...comandas, nova])
    setNovoCliente('')
  }

  const adicionarItem = () => {
    if (!comandaSelecionada || !itemNome || itemPreco <= 0) return
    const atualizadas = comandas.map((comanda) =>
      comanda.id === comandaSelecionada
        ? {
            ...comanda,
            itens: [...comanda.itens, { nome: itemNome, preco: itemPreco, pago: false }]
          }
        : comanda
    )
    setComandas(atualizadas)
    setItemNome('')
    setItemPreco(0)
  }

  const marcarPagos = (comandaId: string) => {
    const atualizadas = comandas.map((comanda) => {
      if (comanda.id !== comandaId) return comanda
      const novosItens = comanda.itens.map((item) => (item.pago ? item : { ...item, pago: true }))
      const finalizada = novosItens.every((i) => i.pago)
      return { ...comanda, itens: novosItens, finalizada }
    })
    setComandas(atualizadas)
  }

  const removerComanda = (id: string) => {
    const confirm = window.confirm('Tem certeza que deseja excluir esta comanda?')
    if (!confirm) return
    setComandas(comandas.filter((c) => c.id !== id))
    if (comandaSelecionada === id) setComandaSelecionada(null)
  }

  return (
    <Layout title="Comandas e Consumo">
      <div className="max-w-4xl mx-auto text-black space-y-8">

        {/* Criar Nova Comanda */}
        <div className="bg-white p-4 shadow rounded space-y-2">
          <h2 className="text-xl font-bold">🆕 Nova Comanda</h2>
          <div className="flex gap-2">
            <input
              className="border px-3 py-2 rounded w-full"
              placeholder="Nome do Cliente ou Chalé"
              value={novoCliente}
              onChange={(e) => setNovoCliente(e.target.value)}
            />
            <Botao texto="Criar" onClick={criarComanda} />
          </div>
        </div>

        {/* Lista de Comandas */}
        <div className="space-y-4">
          {comandas.map((comanda) => (
            <div key={comanda.id} className="bg-white p-4 shadow rounded">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">
                    {comanda.cliente} {comanda.finalizada && <span className="text-green-600">(Fechada)</span>}
                  </h3>
                  <p className="text-sm text-gray-600">Criada em: {new Date(comanda.data).toLocaleString()}</p>
                </div>
                <button className="text-red-600 font-bold" onClick={() => removerComanda(comanda.id)}>
                  ❌ Remover
                </button>
              </div>

              {/* Itens da Comanda */}
              <ul className="mt-3 space-y-1">
                {comanda.itens.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex justify-between px-3 py-1 rounded ${
                      item.pago ? 'bg-green-100 line-through' : 'bg-yellow-100'
                    }`}
                  >
                    <span>{item.nome}</span>
                    <span>R$ {item.preco.toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {/* Ações */}
              {!comanda.finalizada && (
                <>
                  <div className="flex gap-2 mt-3">
                    <input
                      className="border px-3 py-2 rounded w-full"
                      placeholder="Novo item"
                      value={itemNome}
                      onChange={(e) => setItemNome(e.target.value)}
                      onFocus={() => setComandaSelecionada(comanda.id)}
                    />
                    <input
                      className="border px-3 py-2 rounded w-28"
                      type="number"
                      value={itemPreco}
                      onChange={(e) => setItemPreco(Number(e.target.value))}
                      placeholder="Preço"
                    />
                    <Botao texto="Adicionar" onClick={adicionarItem} />
                  </div>

                  <div className="mt-2">
                    <Botao texto="✅ Pagar Itens Selecionados" onClick={() => marcarPagos(comanda.id)} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
