'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Botao from '@/components/ui/Botao'
import { useProtegido } from '@/utils/proteger'

// Converte datas para "YYYY-MM-DD" para o input date
function toDateInputValue(dateStr?: string) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr.substring(0, 10);
  if (dateStr.includes('/')) {
    const [dia, mes, ano] = dateStr.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return '';
}

// Sempre exibe datas como "dd/mm/aaaa" ignorando horas e timezone
function formatarDataBr(dt: string) {
  if (!dt) return '';
  let soData = dt;
  if (dt.includes('T')) soData = dt.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(soData)) {
    const [ano, mes, dia] = soData.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  // fallback: tenta criar date normal
  try {
    const d = new Date(dt);
    if (!isNaN(+d)) {
      return d.toLocaleDateString('pt-BR');
    }
  } catch {}
  return dt;
}

type Acompanhante = {
  nome: string
  criarComanda: boolean
}

export default function CheckInPage() {
  useProtegido()
  const router = useRouter()
  const query = typeof window !== 'undefined'
    ? Object.fromEntries(new URLSearchParams(window.location.search))
    : {}

  const reservaId = query.reservaId as string;

  const [mostrarForm, setMostrarForm] = useState(false)
  const [checkins, setCheckins] = useState<any[]>([])
  const [mostrarDetalhesId, setMostrarDetalhesId] = useState<number | null>(null)

  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [nacionalidade, setNacionalidade] = useState('')
  const [documento, setDocumento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [numero, setNumero] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [acompanhantes, setAcompanhantes] = useState<Acompanhante[]>([])
  const [entrada, setEntrada] = useState('')
  const [saida, setSaida] = useState('')
  const [chale, setChale] = useState('')
  const [valor, setValor] = useState('')
  const [usarDesconto, setUsarDesconto] = useState(true)
  const [precos, setPrecos] = useState<any>(null)
  const [comCafe, setComCafe] = useState(true);

  useEffect(() => {
    fetch('/api/precos')
      .then(res => res.json())
      .then(data => setPrecos(data))
  }, [])

  const [adultos, setAdultos] = useState('1')
  const [criancas0a3, setCriancas0a3] = useState('0')
  const [criancas4a9, setCriancas4a9] = useState('0')
  const [valorEntrada, setValorEntrada] = useState('')
  const [descontoPersonalizado, setDescontoPersonalizado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const chales = [
    ...Array.from({ length: 10 }, (_, i) => `Chalé ${i + 1}`),
    "Casa d'Água",
    "Chalé 12",
    "Chalé 13",
    "Chalé 14",
    "Campeira"
  ]

  const carregarCheckins = async () => {
    const res = await fetch('/api/checkin')
    const lista = await res.json()
    setCheckins(lista)
  }

  useEffect(() => {
    carregarCheckins()
  }, [])

  // Preenche automaticamente ao abrir pelo botão de reservas
  useEffect(() => {
    if (query.nome) setNome(query.nome as string)
    if (query.documento) setDocumento(query.documento as string)
    if (query.telefone) setTelefone(query.telefone as string)
    if (query.email) setEmail(query.email as string)
    if (query.chale) setChale(query.chale as string)
    if (query.entrada) setEntrada(toDateInputValue(query.entrada as string))
    if (query.saida) setSaida(toDateInputValue(query.saida as string))
    if (query.valor) {
      setValor(query.valor as string)
      setUsarDesconto(false)
    }
    if (query.valorPagoAntecipado) setValorEntrada(query.valorPagoAntecipado as string)
    if (query.criancas0a3) setCriancas0a3(query.criancas0a3 as string)
    if (query.criancas4a9) setCriancas4a9(query.criancas4a9 as string)
    if (query.desconto) setDescontoPersonalizado(query.desconto as string)
    if (query.observacoes) setObservacoes(query.observacoes as string)
    if (query.numeroPessoas) setAdultos(query.numeroPessoas as string)
    if (query.nome || query.telefone || query.chale) setMostrarForm(true)
  }, [])

  // Calcula valor sempre que entradas mudam
  useEffect(() => {
    if (!precos || !entrada || !saida) {
      setValor('0')
      return
    }
    if (query.valor) {
      setValor(query.valor as string)
      return
    }

    const inicio = new Date(entrada)
    const fim = new Date(saida)
    const dias = Math.ceil((+fim - +inicio) / (1000 * 60 * 60 * 24))
    if (dias <= 0) {
      setValor('0')
      return
    }
    const adultosNum = parseInt(adultos || '0')
    const c03 = parseInt(criancas0a3 || '0')
    const c49 = parseInt(criancas4a9 || '0')

    const campoCafe = comCafe ? 'comCafe' : 'semCafe'
    let valorBase = 0

    if (adultosNum === 1) {
      valorBase = precos.hospedagem.individual?.[campoCafe] || 0
    } else if (adultosNum === 2) {
      valorBase = precos.hospedagem.casal?.[campoCafe] || 0
    } else if (adultosNum === 3) {
      valorBase = precos.hospedagem.tresPessoas?.[campoCafe] || 0
    } else if (adultosNum === 4) {
      valorBase = precos.hospedagem.quatroPessoas?.[campoCafe] || 0
    } else if (adultosNum > 4) {
      valorBase = adultosNum * (precos.hospedagem.maisQuatro?.[campoCafe] || 0)
    }

    let valorCrianca49 = precos.hospedagem?.criancas?.de4a9 ? Number(precos.hospedagem.criancas.de4a9) : 0

    let subtotal = valorBase * dias
    subtotal += valorCrianca49 * c49 * dias

    let descontoValor = parseFloat(descontoPersonalizado) || 0
    if (descontoValor > 0) {
      subtotal = subtotal * (1 - descontoValor / 100)
    }
    setValor(Number(subtotal).toFixed(2))
  }, [
    entrada, saida, adultos, criancas0a3, criancas4a9, descontoPersonalizado, precos, query.valor, comCafe
  ])

  const handleSalvar = async () => {
    const novoCheckin = {
      nome,
      dataNascimento,
      sexo,
      telefone,
      email,
      nacionalidade,
      documento,
      endereco,
      bairro,
      numero,
      cidade,
      estado,
      cep,
      acompanhantes,
      entrada,
      saida,
      chale,
      valor,
      valorEntrada,
      adultos,
      criancas0a3,
      criancas4a9,
      descontoPersonalizado,
      observacoes,
      updatedAt: new Date().toISOString()
    }

    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCheckin)
    })

    if (res.ok) {
      const checkinCriado = await res.json();
      const checkinId = checkinCriado.id;

      if (reservaId) {
        await fetch('/api/reservas', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: reservaId }),
        });
      }

      const dataCriacao = new Date().toISOString();
      const subcomandas = [
        {
          id: `hospede-${Date.now()}`,
          nome: nome,
          tipo: 'hospede',
          itens: [],
          total: 0
        },
        ...acompanhantes.filter(a => a.criarComanda).map(a => ({
          id: `acomp-${Date.now()}-${Math.random()}`,
          nome: a.nome,
          tipo: 'acompanhante',
          itens: [],
          total: 0
        }))
      ];

      await fetch('/api/consumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: chale,
          hospede: true,
          checkinId,
          status: 'aberta',
          criadoEm: dataCriacao,
          updatedAt: Date.now(),
          subcomandas
        })
      })

      await carregarCheckins()
      alert('✅ Check-in salvo com sucesso e comanda criada!')
      resetarFormulario()
      setMostrarForm(false)
    }
  }

  const excluirCheckin = async (id: number) => {
    await fetch('/api/checkin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    await carregarCheckins()
  }

  const resetarFormulario = () => {
    setNome('')
    setDataNascimento('')
    setSexo('')
    setTelefone('')
    setEmail('')
    setNacionalidade('')
    setDocumento('')
    setEndereco('')
    setBairro('')
    setNumero('')
    setCidade('')
    setEstado('')
    setCep('')
    setAcompanhantes([])
    setEntrada('')
    setSaida('')
    setChale('')
    setValor('')
    setValorEntrada('')
    setAdultos('1')
    setCriancas0a3('0')
    setCriancas4a9('0')
    setDescontoPersonalizado('')
    setObservacoes('')
    setUsarDesconto(true)
  }

  return (
    <Layout title="Check-In">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <span role="img" aria-label="check-in">🛎️</span>
            Check-ins Registrados
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">{checkins.length}</span>
          </h2>
          <Botao texto="Novo Check-in" onClick={() => setMostrarForm(true)} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
        {checkins.map((c: any) => (
          <div key={c.id} className="rounded-xl shadow bg-white p-6 border border-gray-100 flex flex-col gap-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-700 font-bold text-lg">{c.nome}</span>
              <span className="text-blue-700 font-bold">R$ {c.valor}</span>
            </div>
            <div className="text-sm grid grid-cols-2 gap-x-6">
              <span><strong>Chalé:</strong> {c.chale}</span>
              <span><strong>Entrada:</strong> {formatarDataBr(c.entrada)}</span>
              <span><strong>Saída:</strong> {formatarDataBr(c.saida)}</span>
              <span><strong>Adultos:</strong> {c.adultos}</span>
              <span><strong>Crianças 0-3:</strong> {c.criancas0a3 || 0}</span>
              <span><strong>Crianças 4-9:</strong> {c.criancas4a9 || 0}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Botao
                texto={mostrarDetalhesId === c.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                variant="secondary"
                onClick={() =>
                  setMostrarDetalhesId(mostrarDetalhesId === c.id ? null : c.id)
                }
              />
              <Botao
                texto="Excluir"
                variant="danger"
                onClick={() => excluirCheckin(c.id)}
              />
            </div>
            {mostrarDetalhesId === c.id && (
              <div className="mt-4 border-t pt-2 text-sm space-y-1 text-gray-700">
                <p><strong>Data de Nascimento:</strong> {formatarDataBr(c.dataNascimento)}</p>
                <p><strong>Sexo:</strong> {c.sexo}</p>
                <p><strong>Email:</strong> {c.email}</p>
                <p><strong>Nacionalidade:</strong> {c.nacionalidade}</p>
                <p><strong>Documento:</strong> {c.documento}</p>
                <p><strong>Endereço:</strong> {`${c.endereco}, ${c.numero} - ${c.bairro}`}</p>
                <p><strong>Cidade:</strong> {c.cidade} - {c.estado}, CEP {c.cep}</p>
                <p><strong>Valor Pago na Entrada:</strong> R$ {c.valorEntrada}</p>
                <p><strong>Adultos:</strong> {c.adultos}</p>
                <p><strong>Crianças 0 a 3:</strong> {c.criancas0a3}</p>
                <p><strong>Crianças 4 a 9:</strong> {c.criancas4a9}</p>
                <p><strong>Desconto Personalizado:</strong> {c.descontoPersonalizado}%</p>
                <p><strong>Observações:</strong> {c.observacoes}</p>
                <p><strong>Acompanhantes:</strong></p>
                <ul className="list-disc ml-5">
                  {(typeof c.acompanhantes === 'string' ? JSON.parse(c.acompanhantes) : c.acompanhantes)?.map((a: Acompanhante, i: number) => (
                    <li key={i}>
                      {a.nome} — {a.criarComanda ? '🧾 Comanda criada' : 'Sem comanda'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        </div>

        {mostrarForm && (
          <form className="space-y-6 border p-6 rounded-xl bg-white shadow max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-black flex items-center gap-2">
              <span role="img" aria-label="check-in">📝</span>
              Novo Check-in
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} />
              <Input label="Data de Nascimento" type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
              <Select label="Sexo" value={sexo} onChange={e => setSexo(e.target.value)} options={['Masculino', 'Feminino', 'Outro']} />
              <Input label="Fone" value={telefone} onChange={e => setTelefone(e.target.value)} />
              <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
              <Input label="Nacionalidade" value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} />
              <Input label="Documento / CPF" value={documento} onChange={e => setDocumento(e.target.value)} />
              <Input label="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} />
              <Input label="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} />
              <Input label="Número" value={numero} onChange={e => setNumero(e.target.value)} />
              <Input label="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} />
              <Input label="Estado" value={estado} onChange={e => setEstado(e.target.value)} />
              <Input label="CEP" value={cep} onChange={e => setCep(e.target.value)} />
            </div>
            {/* ...Acompanhantes... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
              <Input label="Saída" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
              <Select label="Chalé" value={chale} onChange={e => setChale(e.target.value)} options={chales} />
              <Input label="Adultos" type="number" value={adultos} onChange={e => setAdultos(e.target.value)} />
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={comCafe}
                  onChange={e => setComCafe(e.target.checked)}
                />
                Com café da manhã
              </label>
              <Input label="Crianças 0 a 3 anos (grátis)" type="number" value={criancas0a3} onChange={e => setCriancas0a3(e.target.value)} />
              <Input label="Crianças 4 a 9 anos" type="number" value={criancas4a9} onChange={e => setCriancas4a9(e.target.value)} />
              <Input label="Desconto Personalizado (%)" type="number" value={descontoPersonalizado} onChange={e => setDescontoPersonalizado(e.target.value)} />
              <Input label="Valor pago na entrada (R$)" type="number" prefixoMonetario value={valorEntrada} onChange={e => setValorEntrada(e.target.value)} />
              <Input label="Valor total (R$)" type="number" prefixoMonetario value={valor} onChange={e => setValor(e.target.value)} />
              <Input label="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Botao texto="Cancelar" variant="secondary" onClick={() => setMostrarForm(false)} />
              <Botao texto="Salvar Check-In" onClick={handleSalvar} />
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}
