'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { db, CheckIn, Consumo, ItemComanda } from '@/utils/db'

export default function CheckoutPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [filtro, setFiltro] = useState('')
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [mostrarDetalhes, setMostrarDetalhes] = useState<number | null>(null)

  useEffect(() => {
    async function carregarDados() {
      const cks = await db.checkins.toArray()
      const cs = await db.consumos.toArray()
      setCheckins(cks)
      setConsumos(cs)
    }
    carregarDados()
  }, [])

  const atualizarComanda = async (comanda: Consumo) => {
    await db.consumos.put({
      ...comanda,
      updatedAt: Date.now(),
    })
  }

  const finalizarCheckout = async (checkin: CheckIn) => {
    const comandas = await db.consumos.where('checkinId').equals(checkin.id).toArray()

    for (const comanda of comandas) {
      await atualizarComanda({ ...comanda, status: 'fechada' })
    }

    const valorTotalHospedagem = Number(checkin.valor || 0)
    await db.checkouts.add({
      data: new Date().toISOString(),
      nome: checkin.nome,
      chale: checkin.chale,
      valor: valorTotalHospedagem
    })

    await db.checkins.delete(checkin.id)
    setCheckins(await db.checkins.toArray())

    alert(`✅ Check-out finalizado para ${checkin.nome}.`)
  }

  const checkinsFiltrados = checkins.filter((c) =>
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <Layout title="Check-Out">
      <div className="max-w-3xl mx-auto space-y-6 text-black">
        <div className="max-w-sm">
          <Input
            label="Buscar por nome"
            placeholder="Digite o nome do hóspede"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {checkinsFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum hóspede encontrado.</p>
        ) : (
          <div className="space-y-4">
            {checkinsFiltrados.map((checkin) => {
              const valorHospedagem = Number(checkin.valor || 0)
              const valorEntrada = Number(checkin.valorEntrada || 0)

              const comandasDoCheckin = consumos.filter((c) => c.checkinId === checkin.id)

              const itensPagos: ItemComanda[] = []
              const itensPendentes: ItemComanda[] = []

              comandasDoCheckin.forEach((comanda) =>
                comanda.subcomandas.forEach((sub) =>
                  sub.itens.forEach((item) => {
                    if (item.pago) {
                      itensPagos.push(item)
                    } else {
                      itensPendentes.push(item)
                    }
                  })
                )
              )

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
                <div key={checkin.id} className="bg-white rounded shadow border p-4 space-y-2">
                  <p><strong>Nome:</strong> {checkin.nome}</p>
                  <p><strong>Chalé:</strong> {checkin.chale}</p>
                  <p><strong>Entrada:</strong> {checkin.entrada}</p>
                  <p><strong>Saída:</strong> {checkin.saida}</p>
                  <p><strong>Valor Hospedagem:</strong> R$ {valorHospedagem.toFixed(2)}</p>
                  <p><strong>Pago na entrada:</strong> R$ {valorEntrada.toFixed(2)}</p>

                  {mostrar && (
                    <>
                      {itensPagos.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-green-700">Itens Pagos:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {itensPagos.map((item, i) => (
                              <li key={i}>
                                {item.nome} ({item.quantidade}x) - R$ {(item.preco * item.quantidade).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {itensPendentes.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold text-red-600">⚠️ Itens Pendentes:</p>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {itensPendentes.map((item, i) => (
                              <li key={i}>
                                {item.nome} ({item.quantidade}x) - R$ {(item.preco * item.quantidade).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <p className="mt-2 text-green-800 font-semibold">
                    ✅ Já pago (comandas): R$ {totalItensPagos.toFixed(2)}
                  </p>

                  <p className="text-red-700 font-semibold">
                    ❌ Falta pagar: R$ {totalPendente.toFixed(2)}
                  </p>

                  <div className="pt-2 flex gap-3">
                    <Botao
                      texto={mostrar ? '🔒 Ocultar Detalhes' : '💰 Finalizar Checkout'}
                      onClick={() =>
                        setMostrarDetalhes(mostrar ? null : checkin.id)
                      }
                    />
                    {mostrar && (
                      <Botao
                        texto="✅ Confirmar Check-Out"
                        onClick={() => finalizarCheckout(checkin)}
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
