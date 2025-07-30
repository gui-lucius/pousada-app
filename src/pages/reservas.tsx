import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Botao from '@/components/ui/Botao'

type Reserva = {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  numeroPessoas: number;
  chale: string;
  valor: number;
  observacoes?: string;
  status: string;
}

export default function ReservasPage() {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])

  // States do form
  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [entrada, setEntrada] = useState('')
  const [saida, setSaida] = useState('')
  const [pessoas, setPessoas] = useState('')
  const [chale, setChale] = useState('')
  const [obs, setObs] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(0)
  const [reservaEditandoId, setReservaEditandoId] = useState<string | null>(null)

  // Exemplo de cálculo (ajuste para seu cenário de preço real)
  const calcularValor = useCallback(() => {
    if (!entrada || !saida || !pessoas) {
      setValorTotal(0)
      return
    }
    const adultos = Math.max(0, Number(pessoas) || 0)
    const dataEntrada = new Date(entrada)
    const dataSaida = new Date(saida)
    const diarias = Math.ceil((+dataSaida - +dataEntrada) / (1000 * 60 * 60 * 24))
    if (diarias <= 0 || adultos <= 0) {
      setValorTotal(0)
      return
    }
    const valorBase = 120 // Exemplo: valor fixo por diária por pessoa
    const total = valorBase * adultos * diarias
    setValorTotal(Number(total.toFixed(2)))
  }, [entrada, saida, pessoas])

  // Buscar reservas do banco
  const buscarReservas = useCallback(async () => {
    const res = await fetch('/api/reservas')
    const data = await res.json()
    setReservas(data)
  }, [])

  useEffect(() => {
    buscarReservas()
  }, [buscarReservas])

  useEffect(() => {
    calcularValor()
  }, [calcularValor])

  const limparCampos = () => {
    setNome('')
    setDocumento('')
    setTelefone('')
    setEntrada('')
    setSaida('')
    setPessoas('')
    setChale('')
    setObs('')
    setValorTotal(0)
    setReservaEditandoId(null)
  }

  const preencherCamposParaEditar = (reserva: Reserva) => {
    setReservaEditandoId(reserva.id)
    setNome(reserva.nome)
    setDocumento(reserva.documento)
    setTelefone(reserva.telefone)
    setEntrada(reserva.dataEntrada.substring(0, 10))
    setSaida(reserva.dataSaida.substring(0, 10))
    setPessoas(reserva.numeroPessoas.toString())
    setChale(reserva.chale)
    setObs(reserva.observacoes ?? '')
    setValorTotal(Number(reserva.valor) || 0)
    setMostrarForm(true)
  }

  const handleReservar = async () => {
    if (!nome || !documento || !entrada || !saida || !pessoas || !chale) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }
    const reservaBody = {
      nome: nome.trim(),
      documento: documento.trim(),
      telefone: telefone.trim(),
      dataEntrada: entrada,
      dataSaida: saida,
      numeroPessoas: Number(pessoas),
      chale,
      valor: valorTotal,
      observacoes: obs.trim(),
      status: 'reservado'
    }
    if (reservaEditandoId) {
      // Editar
      await fetch('/api/reservas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservaEditandoId, ...reservaBody })
      })
      alert('✏️ Reserva atualizada com sucesso!')
    } else {
      // Criar
      await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservaBody)
      })
      alert('✅ Reserva registrada com sucesso!')
    }
    buscarReservas()
    limparCampos()
    setMostrarForm(false)
  }

  const cancelarReserva = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return
    await fetch('/api/reservas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    buscarReservas()
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
                  <p><strong>Documento:</strong> {r.documento}</p>
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
                          documento: r.documento,
                          telefone: r.telefone,
                          chale: r.chale,
                          entrada: r.dataEntrada,
                          saida: r.dataSaida,
                          valor: String(r.valor)
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
            <Input label="Nome do Hóspede *" value={nome} onChange={e => setNome(e.target.value)} />
            <Input label="Documento *" value={documento} onChange={e => setDocumento(e.target.value)} />
            <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
            <Input label="Data de Entrada *" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
            <Input label="Data de Saída *" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
            <Input label="Nº de Pessoas (Adultos) *" type="number" min={0} value={pessoas} onChange={e => setPessoas(e.target.value)} />
            <Select
              label="Chalé *"
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
