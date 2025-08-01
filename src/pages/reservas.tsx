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
  dataEntrada: string; // "YYYY-MM-DD"
  dataSaida: string;   // "YYYY-MM-DD"
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

// Exibe data sempre como "dd/mm/aaaa", cortando qualquer coisa além do dia!
function formatarDataBr(dt: string) {
  if (!dt) return ''
  const soData = dt.slice(0, 10) // Sempre pega só a parte da data
  if (/^\d{4}-\d{2}-\d{2}/.test(soData)) {
    const [ano, mes, dia] = soData.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return dt
}
function hojeISO() {
  const hoje = new Date()
  hoje.setHours(0,0,0,0)
  return hoje.toISOString().substring(0,10)
}
function addDiasISO(dateStr: string, dias: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + dias)
  return d.toISOString().substring(0,10)
}

export default function ReservasPage() {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [reservas, setReservas] = useState<Reserva[]>([])

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
  const [comCafe, setComCafe] = useState(true)
  const [dataCorrigida, setDataCorrigida] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/precos')
      .then(res => res.json())
      .then(data => setPrecos(data))
  }, [])

  const opcoesChales = [
    ...Array.from({ length: 10 }, (_, i) => `Chalé ${i + 1}`),
    "Casa d'Água",
    "Chalé 12",
    "Chalé 13",
    "Chalé 14",
    "Campeira"
  ]

  useEffect(() => {
    if (entrada && entrada < hojeISO()) {
      setEntrada(hojeISO())
      setDataCorrigida('A data de entrada foi ajustada para hoje.')
      return
    }
    if (entrada && saida && saida <= entrada) {
      const novaSaida = addDiasISO(entrada, 1)
      setSaida(novaSaida)
      setDataCorrigida('A data de saída foi ajustada para um dia após a entrada.')
    } else {
      setDataCorrigida(null)
    }
  }, [entrada, saida])

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

    const campoCafe = comCafe ? 'comCafe' : 'semCafe'
    let valorBase = 0

    if (adultos <= 1) {
      valorBase = precos.hospedagem.individual?.[campoCafe] || 0
    } else if (adultos === 2) {
      valorBase = precos.hospedagem.casal?.[campoCafe] || 0
    } else if (adultos === 3) {
      valorBase = precos.hospedagem.tresPessoas?.[campoCafe] || 0
    } else if (adultos === 4) {
      valorBase = precos.hospedagem.quatroPessoas?.[campoCafe] || 0
    } else if (adultos > 4) {
      valorBase = adultos * (precos.hospedagem.maisQuatro?.[campoCafe] || 0)
    }

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
  }, [entrada, saida, pessoas, precos, desconto, criancas0a3, criancas4a9, comCafe])

  useEffect(() => { calcularValor() }, [calcularValor])

  const buscarReservas = useCallback(async () => {
    const res = await fetch('/api/reservas')
    const data = await res.json()
    setReservas(data)
  }, [])

  useEffect(() => { buscarReservas() }, [buscarReservas])

  const limparCampos = () => {
    setNome(''); setDocumento(''); setTelefone(''); setEmail('')
    setEntrada(''); setSaida(''); setPessoas(''); setChale(''); setObs('')
    setValorTotal(0); setDesconto(''); setValorPagoAntecipado(''); setCriancas0a3(''); setCriancas4a9('')
    setReservaEditandoId(null); setComCafe(true); setDataCorrigida(null)
  }

  const preencherCamposParaEditar = (reserva: Reserva) => {
    setReservaEditandoId(reserva.id)
    setNome(reserva.nome)
    setDocumento(reserva.documento)
    setTelefone(reserva.telefone)
    setEmail(reserva.email ?? '')
    setEntrada(reserva.dataEntrada.slice(0, 10)) // Pega só a data, nunca hora
    setSaida(reserva.dataSaida.slice(0, 10))
    setPessoas(reserva.numeroPessoas.toString())
    setChale(reserva.chale)
    setObs(reserva.observacoes ?? '')
    setValorTotal(Number(reserva.valor) || 0)
    setDesconto(String(reserva.desconto ?? ''))
    setValorPagoAntecipado(String(reserva.valorPagoAntecipado ?? ''))
    setCriancas0a3(String(reserva.criancas0a3 ?? ''))
    setCriancas4a9(String(reserva.criancas4a9 ?? ''))
    setComCafe(true)
    setMostrarForm(true)
    setDataCorrigida(null)
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
      dataEntrada: entrada, // "YYYY-MM-DD"
      dataSaida: saida,     // "YYYY-MM-DD"
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
      <div className="max-w-4xl mx-auto space-y-8 text-black px-2">
        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📅 Reservas Registradas
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">{reservas.length}</span>
          </h2>
          <button
            onClick={() => { limparCampos(); setMostrarForm(true) }}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow font-semibold flex items-center gap-2 hover:bg-blue-700 transition"
          >
            ➕ Nova Reserva
          </button>
        </div>

        {/* LISTAGEM DE RESERVAS */}
        {reservas.length === 0 ? (
          <p className="text-gray-400">Nenhuma reserva registrada ainda.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {reservas.map((r) => (
              <div key={r.id} className="rounded-xl shadow bg-white p-6 space-y-1 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="inline-block text-blue-700 font-bold text-lg">{r.nome}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full font-bold
                      ${r.status === 'reservado' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {r.status === 'reservado' ? 'Reservado' : r.status}
                    </span>
                  </div>
                  <span className="text-blue-700 font-bold">R$ {Number(r.valor).toFixed(2)}</span>
                </div>
                <div className="text-sm grid grid-cols-2 gap-x-6">
                  <span><strong>Chalé:</strong> {r.chale}</span>
                  <span><strong>Entrada:</strong> {formatarDataBr(r.dataEntrada)}</span>
                  <span><strong>Saída:</strong> {formatarDataBr(r.dataSaida)}</span>
                  <span><strong>Adultos:</strong> {r.numeroPessoas}</span>
                  <span><strong>Crianças 0-3:</strong> {r.criancas0a3 || 0}</span>
                  <span><strong>Crianças 4-9:</strong> {r.criancas4a9 || 0}</span>
                </div>
                <div className="text-xs mt-2 text-gray-500">{r.observacoes}</div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Botao
                    texto="✅ Fazer Check-in"
                    onClick={() => {
                      router.push(
                        `/checkin?reservaId=${r.id}` +
                        `&nome=${encodeURIComponent(r.nome)}` +
                        `&documento=${encodeURIComponent(r.documento)}` +
                        `&telefone=${encodeURIComponent(r.telefone)}` +
                        `&email=${encodeURIComponent(r.email ?? '')}` +
                        `&chale=${encodeURIComponent(r.chale)}` +
                        `&entrada=${encodeURIComponent(r.dataEntrada)}` +
                        `&saida=${encodeURIComponent(r.dataSaida)}` +
                        `&valor=${encodeURIComponent(String(r.valor))}` +
                        `&valorPagoAntecipado=${encodeURIComponent(String(r.valorPagoAntecipado ?? 0))}` +
                        `&desconto=${encodeURIComponent(String(r.desconto ?? 0))}` +
                        `&criancas0a3=${encodeURIComponent(String(r.criancas0a3 ?? 0))}` +
                        `&criancas4a9=${encodeURIComponent(String(r.criancas4a9 ?? 0))}` +
                        `&observacoes=${encodeURIComponent(r.observacoes ?? '')}` +
                        `&numeroPessoas=${encodeURIComponent(r.numeroPessoas)}`
                      )
                    }}
                  />
                  <button
                    onClick={() => preencherCamposParaEditar(r)}
                    className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => cancelarReserva(r.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded font-semibold"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORMULÁRIO DE NOVA/EDITAR RESERVA */}
        {mostrarForm && (
          <div className="border rounded-xl bg-white shadow p-8 space-y-5 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-4">
              {reservaEditandoId ? '✏️ Editar Reserva' : '📝 Nova Reserva'}
            </h2>
            {dataCorrigida && (
              <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-2">
                {dataCorrigida}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nome do Hóspede *" value={nome} onChange={e => setNome(e.target.value)} />
              <Input label="Documento *" value={documento} onChange={e => setDocumento(e.target.value)} />
              <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
              <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input
                label="Data de Entrada *"
                type="date"
                value={entrada}
                min={hojeISO()}
                onChange={e => setEntrada(e.target.value)}
              />
              <Input
                label="Data de Saída *"
                type="date"
                value={saida}
                min={entrada ? addDiasISO(entrada, 1) : hojeISO()}
                onChange={e => setSaida(e.target.value)}
              />
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
            </div>
            <div>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={comCafe} onChange={e => setComCafe(e.target.checked)} />
                Com café da manhã
              </label>
              <Input label="Observações" value={obs} onChange={e => setObs(e.target.value)} />
            </div>
            <div className="text-right font-bold text-xl mb-2">
              💰 Valor Estimado: <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg ml-2">R$ {valorTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { limparCampos(); setMostrarForm(false) }}
                className="text-gray-700 border border-gray-400 px-4 py-2 rounded hover:bg-gray-100"
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
