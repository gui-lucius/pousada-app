import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Botao from '@/components/ui/Botao';

interface Reserva {
  id: number;
  nome: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  numeroPessoas: string;
  chale: string;
  valor: string;
  observacoes: string;
  status: 'reservado';
}

export default function ReservasPage() {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [pessoas, setPessoas] = useState('');
  const [chale, setChale] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pousada_reservas') || '[]');
    setReservas(dados);
  }, []);

  const salvarReservas = (novas: Reserva[]) => {
    localStorage.setItem('pousada_reservas', JSON.stringify(novas));
    setReservas(novas);
  };

  const handleReservar = () => {
    const nova: Reserva = {
      id: Date.now(),
      nome,
      telefone,
      dataEntrada: entrada,
      dataSaida: saida,
      numeroPessoas: pessoas,
      chale,
      valor,
      observacoes: obs,
      status: 'reservado',
    };

    const novas = [...reservas, nova];
    salvarReservas(novas);

    setNome('');
    setTelefone('');
    setEntrada('');
    setSaida('');
    setPessoas('');
    setChale('');
    setValor('');
    setObs('');
    setMostrarForm(false);
    alert('Reserva registrada!');
  };

  const cancelarReserva = (id: number) => {
    const atualizadas = reservas.filter(r => r.id !== id);
    salvarReservas(atualizadas);
  };

  return (
    <Layout title="Reservas">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Reservas registradas */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black">Reservas Registradas</h2>
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              Nova Reserva
            </button>
          </div>

          {reservas.length === 0 && (
            <p className="text-gray-500">Nenhuma reserva registrada ainda.</p>
          )}

          <div className="space-y-4">
            {reservas.map(r => (
              <div key={r.id} className="border p-4 rounded bg-white shadow-sm text-black">
                <p><strong>Nome:</strong> {r.nome}</p>
                <p><strong>Telefone:</strong> {r.telefone}</p>
                <p><strong>Chalé:</strong> {r.chale}</p>
                <p><strong>Entrada:</strong> {r.dataEntrada}</p>
                <p><strong>Saída:</strong> {r.dataSaida}</p>
                <p><strong>Valor:</strong> R$ {r.valor}</p>
                <p><strong>Observações:</strong> {r.observacoes}</p>

                <div className="flex gap-2 mt-2">
                  <Botao
                    texto="Fazer Check-in"
                    onClick={() => {
                      const query = new URLSearchParams({
                        nome: r.nome,
                        telefone: r.telefone,
                        chale: r.chale,
                        entrada: r.dataEntrada,
                        saida: r.dataSaida,
                        valor: r.valor,
                      }).toString();
                      router.push(`/checkin?${query}`);
                    }}
                  />
                  <button
                    onClick={() => cancelarReserva(r.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário de nova reserva */}
        {mostrarForm && (
          <div className="border p-6 rounded bg-white shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-2 text-black">Nova Reserva</h2>
            <Input label="Nome do Hóspede" value={nome} onChange={e => setNome(e.target.value)} />
            <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
            <Input label="Data de Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} />
            <Input label="Data de Saída" type="date" value={saida} onChange={e => setSaida(e.target.value)} />
            <Input label="Nº de Pessoas" type="number" value={pessoas} onChange={e => setPessoas(e.target.value)} />
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
            <Input label="Valor Combinado (R$)" type="number" value={valor} onChange={e => setValor(e.target.value)} />
            <Input label="Observações" value={obs} onChange={e => setObs(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setMostrarForm(false)} className="text-gray-600 border border-gray-400 px-4 py-2 rounded">Cancelar</button>
              <Botao texto="Registrar Reserva" onClick={handleReservar} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
