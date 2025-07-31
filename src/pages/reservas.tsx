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
  email?: string;
  dataEntrada: string;
  dataSaida: string;
  numeroPessoas: number;
  chale: string;
  valor: number;
  desconto?: number;
  valorPagoAntecipado?: number;
  criancas0a3?: number;
  criancas4a9?: number;
  observacoes?: string;
  status: string;
}

// Formatar data para dd/mm/aaaa
function formatarDataBr(dt: string) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('pt-BR')
}

export default function ReservasPage() {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])

  // Novos estados
  const [precos, setPrecos] = useState<any>(null)
  const [desconto, setDesconto] = useState('')
  const [valorPagoAntecipado, setValorPagoAntecipado] = useState('')
  const [criancas0a3, setCriancas0a3] = useState('')
  const [criancas4a9, setCriancas4a9] = useState('')

  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [entrada, setEntrada] = useState('')
  const [saida, setSaida] = useState('')
  const [pessoas, setPessoas] = useState('')
  const [chale, setChale] = useState('')
  const [obs, setObs] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(0)
  const [reservaEditandoId, setReservaEditandoId] = useState<string | null>(null)

  // Buscar preços ao iniciar
  useEffect(() => {
    fetch('/api/precos')
      .then(res => res.json())
      .then(data => setPrecos(data))
  }, [])

  // Chalés de 1 a 10, 11 Casa d'Água, 12 a 14 Chalés, 15 Campeira
  const opcoesChales = [
    ...Array.from({ length: 10 }, (_, i) => `Chalé ${i + 1}`),
    "Casa d'Água",
    "Chalé 12",
    "Chalé 13",
    "Chalé 14",
    "Campeira"
  ]

  const keyPorPessoas: Record<string, string> = {
    '1': 'individual',
    '2': 'casal',
    '3': 'tresPessoas',
    '4': 'quatroPessoas'
  }

  const calcularValor = useCallback(() => {
    if (!entrada || !saida || !pessoas || !precos || !precos.hospedagem) {
      setValorTotal(0)
      return
    }
    const adultos = Math.max(0, Number(pessoas) || 0)
    const c03 = Math.max(0, Number(criancas0a3) || 0)
    const c49 = Math.max(0, Number(criancas4a9) || 0)
    const dataEntrada = new Date(entrada)
    const dataSaida = new Date(saida)
    const diarias = Math.ceil((+dataSaida - +dataEntrada) / (1000 * 60 * 60 * 24))
    if (diarias <= 0 || adultos <= 0) {
      setValorTotal(0)
      return
    }
    const chave = adultos > 4 ? 'maisQuatro' : keyPorPessoas[String(adultos)]
    let valorBase = precos.hospedagem[chave]?.comCafe || 0

    let valorCrianca49 = 0
    if (precos.hospedagem.criancas?.de4a9) {
      valorCrianca49 = Number(precos.hospedagem.criancas.de4a9) || 0
    }

    let subtotal = valorBase * diarias
    subtotal += valorCrianca49 * c49 * diarias

    let descontoValor = Number(desconto) || 0
    if (descontoValor > 0) {
      subtotal = subtotal * (1 - descontoValor / 100)
    }
    setValorTotal(Number(subtotal.toFixed(2)))
  }, [entrada, saida, pessoas, precos, desconto, criancas0a3, criancas4a9])

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
    setEmail('')
    setEntrada('')
    setSaida('')
    setPessoas('')
    setChale('')
    setObs('')
    setValorTotal(0)
    setDesconto('')
    setValorPagoAntecipado('')
    setCriancas0a3('')
    setCriancas4a9('')
    setReservaEditandoId(null)
  }

  const preencherCamposParaEditar = (reserva: Reserva) => {
    setReservaEditandoId(reserva.id)
    setNome(reserva.nome)
    setDocumento(reserva.documento)
    setTelefone(reserva.telefone)
    setEmail(reserva.email ?? '')
    setEntrada(reserva.dataEntrada.substring(0, 10))
    setSaida(reserva.dataSaida.substring(0, 10))
    setPessoas(reserva.numeroPessoas.toString())
    setChale(reserva.chale)
    setObs(reserva.observacoes ?? '')
    setValorTotal(Number(reserva.valor) || 0)
    setDesconto(String(reserva.desconto ?? ''))
    setValorPagoAntecipado(String(reserva.valorPagoAntecipado ?? ''))
    setCriancas0a3(String(reserva.criancas0a3 ?? ''))
    setCriancas4a9(String(reserva.criancas4a9 ?? ''))
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
      email: email.trim(),
      dataEntrada: entrada,
      dataSaida: saida,
      numeroPessoas: Number(pessoas),
      chale,
      valor: valorTotal,
      desconto: Number(desconto) || 0,
      valorPagoAntecipado: Number(valorPagoAntecipado) || 0,
      criancas0a3: Number(criancas0a3) || 0,
      criancas4a9: Number(criancas4a9) || 0,
      observacoes: obs.trim(),
      status: 'reservado'
    }
    if (reservaEditandoId) {
      await fetch('/api/reservas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservaEditandoId, ...reservaBody })
      })
      alert('✏️ Reserva atualizada com sucesso!')
    } else {
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
                  <p><strong>Email:</strong> {r.email ?? '-'}</p>
                  <p><strong>Chalé:</strong> {r.chale}</p>
                  <p><strong>Entrada:</strong> {formatarDataBr(r.dataEntrada)}</p>
                  <p><strong>Saída:</strong> {formatarDataBr(r.dataSaida)}</p>
                  <p><strong>Valor:</strong> R$ {r.valor}</p>
                  <p><strong>Desconto:</strong> {r.desconto ? `${r.desconto}%` : 'Nenhum'}</p>
                  <p><strong>Valor Antecipado:</strong> R$ {r.valorPagoAntecipado || 0}</p>
                  <p><strong>Adultos:</strong> {r.numeroPessoas}</p>
                  <p><strong>Crianças até 3 anos:</strong> {r.criancas0a3 || 0}</p>
                  <p><strong>Crianças 4-9 anos:</strong> {r.criancas4a9 || 0}</p>
                  <p><strong>Observações:</strong> {r.observacoes}</p>
                  <div className="flex gap-2 mt-2">
                    <Botao
                      texto="✅ Fazer Check-in"
                      onClick={() => {
                        router.push(
                          `/checkin?reservaId=${r.id}`
                          + `&nome=${encodeURIComponent(r.nome)}`
                          + `&documento=${encodeURIComponent(r.documento)}`
                          + `&telefone=${encodeURIComponent(r.telefone)}`
                          + `&email=${encodeURIComponent(r.email ?? '')}`
                          + `&chale=${encodeURIComponent(r.chale)}`
                          + `&entrada=${encodeURIComponent(r.dataEntrada)}`
                          + `&saida=${encodeURIComponent(r.dataSaida)}`
                          + `&valor=${encodeURIComponent(String(r.valor))}`
                          + `&valorPagoAntecipado=${encodeURIComponent(String(r.valorPagoAntecipado ?? 0))}`
                          + `&desconto=${encodeURIComponent(String(r.desconto ?? 0))}`
                          + `&criancas0a3=${encodeURIComponent(String(r.criancas0a3 ?? 0))}`
                          + `&criancas4a9=${encodeURIComponent(String(r.criancas4a9 ?? 0))}`
                          + `&observacoes=${encodeURIComponent(r.observacoes ?? '')}`
                          + `&numeroPessoas=${encodeURIComponent(r.numeroPessoas)}`
                        )
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
            <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input label="Data de Entrada *" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
            <Input label="Data de Saída *" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
            <Input label="Nº de Pessoas (Adultos) *" type="number" min={0} value={pessoas} onChange={e => setPessoas(e.target.value)} />

            <Select
              label="Chalé *"
              value={chale}
              onChange={e => setChale(e.target.value)}
              options={['Selecione...', ...opcoesChales]}
            />

            <Input label="Crianças até 3 anos (não paga)" type="number" min={0} value={criancas0a3} onChange={e => setCriancas0a3(e.target.value)} />
            <Input label="Crianças 4 a 9 anos" type="number" min={0} value={criancas4a9} onChange={e => setCriancas4a9(e.target.value)} />

            <Input label="Desconto (%)" type="number" min={0} max={100} value={desconto} onChange={e => setDesconto(e.target.value)} />
            <Input label="Valor Pago Antecipado" type="number" min={0} value={valorPagoAntecipado} onChange={e => setValorPagoAntecipado(e.target.value)} />

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
