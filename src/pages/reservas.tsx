import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Botao from '@/components/ui/Botao'
import { db, Reserva, PrecosConfig } from '@/utils/db'

export default function ReservasPage() {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [entrada, setEntrada] = useState('')
  const [saida, setSaida] = useState('')
  const [pessoas, setPessoas] = useState('')
  const [criancas0a3, setCriancas0a3] = useState('')
  const [criancas4a9, setCriancas4a9] = useState('')
  const [chale, setChale] = useState('')
  const [obs, setObs] = useState('')
  const [comCafe, setComCafe] = useState(true)
  const [usarDesconto, setUsarDesconto] = useState(false)
  const [descontoPersonalizado, setDescontoPersonalizado] = useState('')
  const [entradaPaga, setEntradaPaga] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(0)
  const [precos, setPrecos] = useState<PrecosConfig | null>(null)
  const [reservaEditandoId, setReservaEditandoId] = useState<number | null>(null)

  const calcularValor = useCallback(() => {
    if (!precos || !entrada || !saida) return

    const adultos = Math.max(0, Number(pessoas) || 0)
    const criancaPagante = Math.max(0, Number(criancas4a9) || 0)
    const dataEntrada = new Date(entrada)
    const dataSaida = new Date(saida)
    const diarias = Math.ceil((+dataSaida - +dataEntrada) / (1000 * 60 * 60 * 24))

    if (diarias <= 0 || adultos <= 0) {
      setValorTotal(0)
      return
    }

    let valorDiaria = 0

    if (adultos === 1) {
      valorDiaria = comCafe ? precos.hospedagem.individual.comCafe : precos.hospedagem.individual.semCafe
    } else if (adultos === 2) {
      valorDiaria = comCafe ? precos.hospedagem.casal.comCafe : precos.hospedagem.casal.semCafe
    } else if (adultos === 3) {
      valorDiaria = comCafe ? precos.hospedagem.tresPessoas.comCafe : precos.hospedagem.tresPessoas.semCafe
    } else if (adultos === 4) {
      valorDiaria = comCafe ? precos.hospedagem.quatroPessoas.comCafe : precos.hospedagem.quatroPessoas.semCafe
    } else if (adultos > 4) {
      valorDiaria = (comCafe ? precos.hospedagem.maisQuatro.comCafe : precos.hospedagem.maisQuatro.semCafe) * adultos
    }

    let total = valorDiaria * diarias
    total += criancaPagante * precos.hospedagem.criancas.de4a9 * diarias

    if (usarDesconto) {
      const percentual = Number(descontoPersonalizado) || 0
      total -= total * (percentual / 100)
    }

    setValorTotal(Number(total.toFixed(2)))
  }, [precos, entrada, saida, pessoas, criancas4a9, comCafe, usarDesconto, descontoPersonalizado])


  useEffect(() => {
    db.reservas.toArray().then(setReservas)
    db.precos.get('config').then((valor) => setPrecos(valor ?? null))
  }, [])

  useEffect(() => {
    calcularValor()
  }, [calcularValor])

  const limparCampos = () => {
    setNome('')
    setTelefone('')
    setEntrada('')
    setSaida('')
    setPessoas('')
    setCriancas0a3('')
    setCriancas4a9('')
    setChale('')
    setObs('')
    setComCafe(true)
    setUsarDesconto(false)
    setDescontoPersonalizado('')
    setEntradaPaga('')
    setValorTotal(0)
    setReservaEditandoId(null)
  }

  const preencherCamposParaEditar = (reserva: Reserva) => {
    setReservaEditandoId(reserva.id)
    setNome(reserva.nome)
    setTelefone(reserva.telefone)
    setEntrada(reserva.dataEntrada)
    setSaida(reserva.dataSaida)
    setPessoas(reserva.numeroPessoas)
    setCriancas0a3(reserva.criancas0a3 ?? '')
    setCriancas4a9(reserva.criancas4a9 ?? '')
    setChale(reserva.chale)
    setObs(reserva.observacoes)
    setEntradaPaga(reserva.valorEntrada ?? '0')
    setMostrarForm(true)
  }

  const handleReservar = async () => {
    if (!nome || !entrada || !saida || !pessoas || !chale) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    const nova: Reserva = {
      id: reservaEditandoId ?? Date.now(),
      nome: nome.trim(),
      telefone: telefone.trim(),
      dataEntrada: entrada,
      dataSaida: saida,
      numeroPessoas: pessoas,
      criancas0a3,
      criancas4a9,
      chale,
      valor: valorTotal.toFixed(2),
      observacoes: obs.trim(),
      status: 'reservado',
      valorEntrada: entradaPaga || '0',
    }

    if (reservaEditandoId) {
      await db.reservas.put(nova)
    } else {
      await db.reservas.add(nova)
    }

    setReservas(await db.reservas.toArray())
    limparCampos()
    setMostrarForm(false)
    alert(reservaEditandoId ? '✏️ Reserva atualizada com sucesso!' : '✅ Reserva registrada com sucesso!')
  }

  const cancelarReserva = async (id: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return
    await db.reservas.delete(id)
    setReservas(await db.reservas.toArray())
  }

  return (
    <Layout title="Reservas">
      <div className="max-w-3xl mx-auto space-y-8 text-black">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📅 Reservas Registradas</h2>
            <button
              onClick={() => {
                limparCampos()
                setMostrarForm(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              ➕ Nova Reserva
            </button>
          </div>

          {reservas.length === 0 ? (
            <p className="text-gray-500">Nenhuma reserva registrada ainda.</p>
          ) : (
            <div className="space-y-4">
              {reservas.map((r) => (
                <div key={r.id} className="border p-4 rounded bg-white shadow-sm">
                  <p><strong>Nome:</strong> {r.nome}</p>
                  <p><strong>Telefone:</strong> {r.telefone}</p>
                  <p><strong>Chalé:</strong> {r.chale}</p>
                  <p><strong>Entrada:</strong> {r.dataEntrada}</p>
                  <p><strong>Saída:</strong> {r.dataSaida}</p>
                  <p><strong>Valor:</strong> R$ {r.valor}</p>
                  <p><strong>Observações:</strong> {r.observacoes}</p>

                  <div className="flex gap-2 mt-2">
                    <Botao
                      texto="✅ Fazer Check-in"
                      onClick={() => {
                        const query = new URLSearchParams({
                          nome: r.nome,
                          telefone: r.telefone,
                          chale: r.chale,
                          entrada: r.dataEntrada,
                          saida: r.dataSaida,
                          valor: r.valor,
                          valorEntrada: r.valorEntrada ?? '0', // 👈 ADICIONA ESSA LINHA
                        }).toString()
                        router.push(`/checkin?${query}`)
                      }}
                    />

                    <button
                      onClick={() => preencherCamposParaEditar(r)}
                      className="bg-yellow-400 text-black px-4 py-2 rounded"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => cancelarReserva(r.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {mostrarForm && (
          <div className="border p-6 rounded bg-white shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-2">
              {reservaEditandoId ? '✏️ Editar Reserva' : '📝 Nova Reserva'}
            </h2>

            <Input label="Nome do Hóspede" value={nome} onChange={e => setNome(e.target.value)} />
            <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
            <Input label="Data de Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
            <Input label="Data de Saída" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
            <Input label="Nº de Pessoas (Adultos)" type="number" min={0} value={pessoas} onChange={e => setPessoas(e.target.value)} />
            <Input label="Crianças até 3 anos (não pagam)" type="number" min={0} value={criancas0a3} onChange={e => setCriancas0a3(e.target.value)} />
            <Input label="Crianças de 4 a 9 anos (valor reduzido)" type="number" min={0} value={criancas4a9} onChange={e => setCriancas4a9(e.target.value)} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={comCafe} onChange={e => setComCafe(e.target.checked)} />
              ☕ Com Café da Manhã
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={usarDesconto} onChange={e => setUsarDesconto(e.target.checked)} />
              💸 Aplicar desconto
            </label>

            {usarDesconto && (
              <Input
                label="Desconto (%)"
                type="number"
                min={0}
                value={descontoPersonalizado}
                onChange={e => setDescontoPersonalizado(e.target.value)}
              />
            )}

            <Input
              label="Valor já pago (entrada)"
              type="number"
              prefixoMonetario
              min={0}
              value={entradaPaga}
              onChange={e => setEntradaPaga(e.target.value)}
            />

            <Select
              label="Chalé"
              value={chale}
              onChange={e => setChale(e.target.value)}
              options={[
                'Chalé 1', 'Chalé 2', 'Chalé 3', 'Chalé 4', 'Chalé 5',
                'Chalé 6', 'Chalé 7', 'Chalé 8', 'Chalé 9', 'Chalé 10',
                'Casa Da Água', 'Chalé 12', 'Chalé 13', 'Chalé 14, Campeira'
              ]}
            />

            <Input label="Observações" value={obs} onChange={e => setObs(e.target.value)} />

            <div className="text-right font-bold">
              💰 Valor Estimado: R$ {valorTotal.toFixed(2)}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  limparCampos()
                  setMostrarForm(false)
                }}
                className="text-gray-600 border border-gray-400 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <Botao texto={reservaEditandoId ? 'Salvar Alterações' : 'Registrar Reserva'} onClick={handleReservar} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
