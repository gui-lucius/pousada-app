import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Botao from '@/components/ui/Botao';
import { useProtegido } from '@/utils/proteger';

interface CheckIn {
  id: number;
  nome: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  nacionalidade: string;
  documento: string;
  endereco: string;
  bairro: string;
  numero: string;
  cidade: string;
  estado: string;
  cep: string;
  acompanhantes: string;
  entrada: string;
  saida: string;
  chale: string;
  valor: string;
}

export default function CheckInPage() {
  useProtegido();
  const router = useRouter();
  const { query } = router;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [mostrarDetalhesId, setMostrarDetalhesId] = useState<number | null>(null);

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nacionalidade, setNacionalidade] = useState('');
  const [documento, setDocumento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [numero, setNumero] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [acompanhantes, setAcompanhantes] = useState('');
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [chale, setChale] = useState('');
  const [valor, setValor] = useState('');

  const chales = [
    'Chalé 1', 'Chalé 2', 'Chalé 3', 'Chalé 4', 'Chalé 5',
    'Chalé 6', 'Chalé 7', 'Chalé 8', 'Chalé 9', 'Chalé 10',
    'Casa Da Água', 'Chalé 12', 'Chalé 13', 'Chalé 14, Campeira'
  ];

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pousada_checkins') || '[]');
    setCheckins(dados);
  }, []);

  useEffect(() => {
    if (query.nome) setNome(query.nome as string);
    if (query.telefone) setTelefone(query.telefone as string);
    if (query.chale) setChale(query.chale as string);
    if (query.entrada) setEntrada(query.entrada as string);
    if (query.saida) setSaida(query.saida as string);
    if (query.valor) setValor(query.valor as string);
    if (query.nome || query.telefone || query.chale) {
      setMostrarForm(true);
    }
  }, [query]);

  const salvarCheckins = (novos: CheckIn[]) => {
    localStorage.setItem('pousada_checkins', JSON.stringify(novos));
    setCheckins(novos);
  };

  const removerReservaCorrespondente = () => {
    const reservas = JSON.parse(localStorage.getItem('pousada_reservas') || '[]');
    const atualizadas = reservas.filter((r: any) => {
      return !(r.nome === nome && r.telefone === telefone && r.chale === chale);
    });
    localStorage.setItem('pousada_reservas', JSON.stringify(atualizadas));
  };

  const handleSalvar = () => {
    const novo: CheckIn = {
      id: Date.now(),
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
    };

    const atualizados = [...checkins, novo];
    salvarCheckins(atualizados);
    removerReservaCorrespondente();
    alert('Check-in salvo com sucesso!');
    setMostrarForm(false);

    setNome('');
    setDataNascimento('');
    setSexo('');
    setTelefone('');
    setEmail('');
    setNacionalidade('');
    setDocumento('');
    setEndereco('');
    setBairro('');
    setNumero('');
    setCidade('');
    setEstado('');
    setCep('');
    setAcompanhantes('');
    setEntrada('');
    setSaida('');
    setChale('');
    setValor('');
  };

  const excluirCheckin = (id: number) => {
    const atualizados = checkins.filter(c => c.id !== id);
    salvarCheckins(atualizados);
  };

  return (
    <Layout title="Check-In">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black">Check-ins Registrados</h2>
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              Novo Check-in
            </button>
          </div>

          {checkins.length === 0 && (
            <p className="text-gray-500">Nenhum check-in registrado ainda.</p>
          )}

          <div className="space-y-4">
            {checkins.map(c => (
              <div key={c.id} className="border p-4 rounded bg-white shadow-sm text-black">
                <p><strong>Nome:</strong> {c.nome}</p>
                <p><strong>Telefone:</strong> {c.telefone}</p>
                <p><strong>Chalé:</strong> {c.chale}</p>
                <p><strong>Entrada:</strong> {c.entrada}</p>
                <p><strong>Saída:</strong> {c.saida}</p>
                <p><strong>Valor:</strong> R$ {c.valor}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      setMostrarDetalhesId(mostrarDetalhesId === c.id ? null : c.id)
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    {mostrarDetalhesId === c.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                  </button>
                  <button
                    onClick={() => excluirCheckin(c.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Excluir
                  </button>
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
                    <p><strong>Acompanhantes:</strong> {c.acompanhantes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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
              <Input label="Acompanhantes" value={acompanhantes} onChange={e => setAcompanhantes(e.target.value)} />
              <Input label="Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
              <Input label="Saída" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
              <Select label="Chalé" value={chale} onChange={e => setChale(e.target.value)} options={chales} />
              <Input label="Valor (R$)" type="number" value={valor} onChange={e => setValor(e.target.value)} />
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setMostrarForm(false)} className="border px-4 py-2 rounded text-gray-600">Cancelar</button>
              <Botao texto="Salvar Check-In" onClick={handleSalvar} />
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
