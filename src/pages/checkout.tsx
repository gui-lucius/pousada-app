'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'

type CheckIn = {
  id: number | string
  nome: string
  chale: string
  entrada: string
  saida: string
  valor: number
  valorEntrada?: number
}

type ItemComanda = {
  nome: string
  preco: number
  quantidade: number
  pago: boolean
}

type Subcomanda = {
  nome?: string // <-- se tiver nome, mostrar o nome do ocupante!
  itens: ItemComanda[]
}

type Consumo = {
  id: string
  checkinId: number | string
  subcomandas: Subcomanda[]
  status: string
}

export default function CheckoutPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [filtro, setFiltro] = useState('')
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [mostrarDetalhes, setMostrarDetalhes] = useState<number | string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)
      try {
        const checkinsRes = await fetch('/api/checkin')
        setCheckins(await checkinsRes.json())

        const consumosRes = await fetch('/api/consumo')
        setConsumos(await consumosRes.json())
      } catch (err) {
        setErro('Erro ao carregar dados. Tente novamente.')
      }
      setCarregando(false)
    }
    carregarDados()
  }, [])

  const atualizarComanda = async (comanda: Consumo) => {
    // Marca todos os itens como pagos ao fechar
    const subcomandasAtualizadas = comanda.subcomandas.map((sub) => ({
      ...sub,
      itens: sub.itens.map((item) => ({ ...item, pago: true })),
    }))
    await fetch('/api/consumos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...comanda, status: 'fechada', subcomandas: subcomandasAtualizadas }),
    })
  }

  const finalizarCheckout = async (checkin: CheckIn) => {
    setCarregando(true)
    setErro(null)
    const comandasDoCheckin = consumos.filter(c => c.checkinId === checkin.id)

    // 1. Marca todas como pagas e status "fechada"
    for (const comanda of comandasDoCheckin) {
      await atualizarComanda(comanda)
    }

    // 2. REMOVE as comandas do hóspede
    for (const comanda of comandasDoCheckin) {
      await fetch('/api/consumo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comanda.id }),
      })
    }

    // 3. Registra checkout no backend
    await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkinId: checkin.id,
        dataSaidaReal: new Date().toISOString(),
        formaPagamento: 'Dinheiro',
        total: Number(checkin.valor || 0),
      }),
    })

    // 4. Remove o checkin
    await fetch('/api/checkin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: checkin.id }),
    })

    // 5. Atualiza listas/tela
    const checkinsRes = await fetch('/api/checkin')
    setCheckins(await checkinsRes.json())
    setCarregando(false)
    setMostrarDetalhes(null)
    alert(`✅ Check-out finalizado para ${checkin.nome}.`)
  }

  const checkinsFiltrados = checkins.filter((c) =>
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <Layout title="Check-Out">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 text-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Check-Out de Hóspedes</h1>
            <span className="text-gray-500 text-sm">
              Visualize pendências e finalize o check-out de forma segura e prática.
            </span>
          </div>
          <div className="max-w-xs w-full">
            <Input
              label="Buscar por nome"
              placeholder="Digite o nome do hóspede"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="text-center py-16 text-lg text-blue-700">Carregando...</div>
        ) : checkinsFiltrados.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-md text-center">
            Nenhum hóspede encontrado.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {checkinsFiltrados.map((checkin) => {
              const valorHospedagem = Number(checkin.valor || 0)
              const valorEntrada = Number(checkin.valorEntrada || 0)
              const comandasDoCheckin = consumos.filter((c) => c.checkinId === checkin.id)

              // Agrupa por subcomanda!
              const itensPorSubcomanda: { [key: string]: ItemComanda[] } = {}
              comandasDoCheckin.forEach((comanda) =>
                comanda.subcomandas.forEach((sub, i) => {
                  const nome = sub.nome || `Pessoa ${i + 1}`
                  if (!itensPorSubcomanda[nome]) itensPorSubcomanda[nome] = []
                  sub.itens.forEach(item => itensPorSubcomanda[nome].push(item))
                })
              )

              const itensPagos: ItemComanda[] = []
              const itensPendentes: ItemComanda[] = []

              Object.values(itensPorSubcomanda).flat().forEach((item) => {
                if (item.pago) {
                  itensPagos.push(item)
                } else {
                  itensPendentes.push(item)
                }
              })

              const totalItensPagos = itensPagos.reduce(
                (acc, i) => acc + i.preco * i.quantidade,
                0
              )
              const totalItensPendentes = itensPendentes.reduce(
                (acc, i) => acc + i.preco * i.quantidade,
                0
              )
              const hospedagemRestante = valorHospedagem - valorEntrada
              const totalPendente = hospedagemRestante + totalItensPendentes

              const mostrar = mostrarDetalhes === checkin.id

              return (
                <div
                  key={checkin.id}
                  className="bg-white rounded-2xl shadow-lg border hover:shadow-2xl transition p-6 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                        {checkin.nome.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-lg text-gray-900">{checkin.nome}</span>
                      <span className="bg-blue-50 text-blue-700 rounded px-2 py-1 ml-2 text-xs font-semibold">
                        Chalé: {checkin.chale}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <span>
                        <strong>Entrada:</strong> {new Date(checkin.entrada).toLocaleDateString('pt-BR')}
                      </span>
                      <span>
                        <strong>Saída:</strong> {new Date(checkin.saida).toLocaleDateString('pt-BR')}
                      </span>
                      <span><strong>Hospedagem:</strong> <span className="font-medium">R$ {valorHospedagem.toFixed(2)}</span></span>
                      <span><strong>Pago entrada:</strong> <span className="font-medium">R$ {valorEntrada.toFixed(2)}</span></span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-green-50 text-green-800 rounded px-3 py-1 text-sm font-bold">
                        ✅ Já pago comandas: R$ {totalItensPagos.toFixed(2)}
                      </span>
                      <span className="bg-red-50 text-red-700 rounded px-3 py-1 text-sm font-bold">
                        ❌ Falta pagar: R$ {totalPendente.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {mostrar && (
                    <div className="mt-4 space-y-2">
                      {Object.entries(itensPorSubcomanda).map(([nome, itens], idx) => (
                        <div key={idx}>
                          <p className="font-semibold text-blue-800">{nome}</p>
                          <ul className="list-disc list-inside text-sm">
                            {itens.map((item, i) => (
                              <li key={i} className={item.pago ? "text-green-700" : "text-red-700"}>
                                {item.nome} ({item.quantidade}x) - R$ {(item.preco * item.quantidade).toFixed(2)} {item.pago ? "✓" : "• pendente"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-row gap-3 pt-3">
                    <Botao
                      texto={mostrar ? '🔒 Ocultar Detalhes' : '💰 Detalhar Pendências'}
                      onClick={() => setMostrarDetalhes(mostrar ? null : checkin.id)}
                      className="w-full md:w-auto"
                    />
                    {mostrar && (
                      <Botao
                        texto={carregando ? 'Processando...' : '✅ Confirmar Check-Out'}
                        onClick={() => finalizarCheckout(checkin)}
                        disabled={carregando}
                        className="w-full md:w-auto bg-green-700 hover:bg-green-800"
                        // Remove o bloqueio por pendência!
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
