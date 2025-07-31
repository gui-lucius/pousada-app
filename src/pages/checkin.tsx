'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Botao from '@/components/ui/Botao'
import { useProtegido } from '@/utils/proteger'

function toDateInputValue(dateStr?: string) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr.substring(0, 10);
  if (dateStr.includes('/')) {
    const [dia, mes, ano] = dateStr.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return '';
}

type Acompanhante = {
  nome: string
  criarComanda: boolean
}

function formatarDataBr(dt: string) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
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

  // Novos campos vindos da reserva
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

  // BUSCA CHECKINS
  const carregarCheckins = async () => {
    const res = await fetch('/api/checkin')
    const lista = await res.json()
    setCheckins(lista)
  }

  useEffect(() => {
    carregarCheckins()
  }, [])

  // Preencher campos vindos da reserva (query)
  useEffect(() => {
    if (query.nome) setNome(query.nome as string)
    if (query.documento) setDocumento(query.documento as string)
    if (query.telefone) setTelefone(query.telefone as string)
    if (query.email) setEmail(query.email as string)
    if (query.chale) setChale(query.chale as string)
    // Aqui o segredo:
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


  // Cálculo valor automático (quando não vem da reserva)
  useEffect(() => {
    if (!precos || !entrada || !saida || query.valor) return;
    const inicio = new Date(entrada);
    const fim = new Date(saida);
    const dias = Math.ceil((+fim - +inicio) / (1000 * 60 * 60 * 24));
    if (dias <= 0) return;
    let total = 0;
    const nAdultos = parseInt(adultos || '0');
    const c49 = parseInt(criancas4a9 || '0');
    const precoAdulto = precos?.hospedagem?.maisQuatro?.comCafe || 0
    const precoCrianca4a9 = precos?.hospedagem?.criancas?.de4a9 || 0
    total += (nAdultos * precoAdulto + c49 * precoCrianca4a9) * dias;
    if (
      usarDesconto &&
      precos?.hospedagem?.descontoReserva?.aplicar &&
      dias >= precos?.hospedagem?.descontoReserva?.minDiarias
    ) {
      total *= 1 - precos.hospedagem.descontoReserva.percentual / 100;
    }
    if (descontoPersonalizado) {
      const perc = parseFloat(descontoPersonalizado);
      total *= 1 - perc / 100;
    }
    setValor(total.toFixed(2));
  }, [
    usarDesconto,
    entrada,
    saida,
    precos,
    adultos,
    criancas0a3,
    criancas4a9,
    descontoPersonalizado,
    query.valor,
  ]);

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
      acompanhantes, // sem JSON.stringify
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

    // Salva o checkin e pega o id criado pelo banco!
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoCheckin)
    })

    if (res.ok) {
      const checkinCriado = await res.json(); // <- pega o objeto com id
      const checkinId = checkinCriado.id;     // <- agora sim você tem o id do banco!

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
          itens: [],
          total: 0
        },
        ...acompanhantes.filter(a => a.criarComanda).map(a => ({
          id: `acomp-${Date.now()}-${Math.random()}`,
          nome: a.nome,
          itens: [],
          total: 0
        }))
      ]
      await fetch('/api/consumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: chale,
          hospede: true,
          checkinId, // agora sim está definido!
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


  // EXCLUIR CHECKIN
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
          <h2 className="text-xl font-semibold text-black">Check-ins Registrados</h2>
          <Botao texto="Novo Check-in" onClick={() => setMostrarForm(true)} />
        </div>

        {checkins.map((c: any) => (
          <div key={c.id} className="border p-4 rounded bg-white shadow-sm text-black">
            <p><strong>Nome:</strong> {c.nome}</p>
            <p><strong>Telefone:</strong> {c.telefone}</p>
            <p><strong>Chalé:</strong> {c.chale}</p>
            <p><strong>Entrada:</strong> {formatarDataBr(c.entrada)}</p>
            <p><strong>Saída:</strong> {formatarDataBr(c.saida)}</p>
            <p><strong>Valor:</strong> R$ {c.valor}</p>
            <div className="flex gap-2 mt-2">
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
              <div className="mt-4 border-t pt-2 text-sm space-y-1">
                <p><strong>Data de Nascimento:</strong> {c.dataNascimento}</p>
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

        {mostrarForm && (
          <form className="space-y-6 border p-6 rounded bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-black">Novo Check-in</h2>
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
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">👥 Acompanhantes</h3>
              {acompanhantes.map((a, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <Input
                    label={`Nome do Acompanhante #${i + 1}`}
                    value={a.nome}
                    onChange={e => {
                      const novos = [...acompanhantes]
                      novos[i].nome = e.target.value
                      setAcompanhantes(novos)
                    }}
                  />
                  <label className="flex items-center gap-2 mt-1 text-sm text-black">
                    <input
                      type="checkbox"
                      checked={a.criarComanda || false}
                      onChange={e => {
                        const novos = [...acompanhantes]
                        novos[i].criarComanda = e.target.checked
                        setAcompanhantes(novos)
                      }}
                    />
                    Criar comanda vinculada ao chalé
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAcompanhantes([...acompanhantes, { nome: '', criarComanda: false }])}
                className="mt-2 inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-4 py-2 rounded shadow-sm transition"
              >
                <span className="text-lg">➕</span> Adicionar Acompanhante
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
              <Input label="Saída" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
              <Select label="Chalé" value={chale} onChange={e => setChale(e.target.value)} options={chales} />
              <Input label="Adultos" type="number" value={adultos} onChange={e => setAdultos(e.target.value)} />
              <Input label="Crianças 0 a 3 anos (grátis)" type="number" value={criancas0a3} onChange={e => setCriancas0a3(e.target.value)} />
              <Input label="Crianças 4 a 9 anos" type="number" value={criancas4a9} onChange={e => setCriancas4a9(e.target.value)} />
              <Input label="Desconto Personalizado (%)" type="number" value={descontoPersonalizado} onChange={e => setDescontoPersonalizado(e.target.value)} />
              <Input label="Valor pago na entrada (R$)" type="number" prefixoMonetario value={valorEntrada} onChange={e => setValorEntrada(e.target.value)} />
              <Input label="Valor total (R$)" type="number" prefixoMonetario value={valor} onChange={e => setValor(e.target.value)} />
              <Input label="Observações" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
              {!query.valor && (
                <div className="col-span-full flex gap-2 items-center">
                  <input type="checkbox" id="desconto" checked={usarDesconto} onChange={e => setUsarDesconto(e.target.checked)} />
                  <label htmlFor="desconto" className="text-sm text-black font-medium">
                    Aplicar desconto por múltiplas diárias?
                  </label>
                </div>
              )}
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
