import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Botao from '@/components/ui/Botao';
import Input from '@/components/ui/Input';

type CheckIn = {
  id: number;
  nome: string;
  chale: string;
  entrada: string;
  saida: string;
  valor: string;
};

type Consumo = {
  id: number;
  checkinId: number;
  descricao: string;
  valor: number;
  categoria: string;
  observacoes: string;
  data: string;
  pago: boolean;
};

export default function CheckoutPage() {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [filtro, setFiltro] = useState('');
  const [consumos, setConsumos] = useState<Consumo[]>([]);

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem('pousada_checkins') || '[]');
    setCheckins(dados);

    const consumoData = JSON.parse(localStorage.getItem('pousada_consumos') || '[]');
    setConsumos(consumoData);
  }, []);

  const finalizarCheckout = (checkin: CheckIn) => {
    const atualizados = checkins.filter(c => c.id !== checkin.id);
    setCheckins(atualizados);
    localStorage.setItem('pousada_checkins', JSON.stringify(atualizados));

    const consumosAtualizados = consumos.filter(c => c.checkinId !== checkin.id);
    setConsumos(consumosAtualizados);
    localStorage.setItem('pousada_consumos', JSON.stringify(consumosAtualizados));

    alert(`Check-Out finalizado para ${checkin.nome}`);
  };

  const checkinsFiltrados = checkins.filter(c =>
    c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout title="Check-Out">
      <div className="mb-4 max-w-sm">
        <Input
          label="Buscar por nome"
          placeholder="Digite o nome do hóspede"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        />
      </div>

      {checkinsFiltrados.length === 0 && (
        <p className="text-gray-500">Nenhum hóspede encontrado.</p>
      )}

      <div className="space-y-4">
        {checkinsFiltrados.map(checkin => {
          const dias = Math.ceil(
            (new Date(checkin.saida).getTime() - new Date(checkin.entrada).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const valorDiaria = Number(checkin.valor);
          const consumoCliente = consumos.filter(c => c.checkinId === checkin.id);
          const totalConsumo = consumoCliente.reduce((acc, curr) => acc + curr.valor, 0);
          const total = dias * valorDiaria + totalConsumo;

          return (
            <div key={checkin.id} className="border rounded p-4 shadow bg-white space-y-1 text-black">
              <p><strong>Nome:</strong> {checkin.nome}</p>
              <p><strong>Chalé:</strong> {checkin.chale}</p>
              <p><strong>Entrada:</strong> {checkin.entrada}</p>
              <p><strong>Saída:</strong> {checkin.saida}</p>
              <p><strong>Diárias:</strong> {dias} x R$ {valorDiaria}</p>

              {consumoCliente.length > 0 && (
                <div className="mt-2">
                  <p><strong>Consumo:</strong></p>
                  <ul className="list-disc list-inside text-sm">
                    {consumoCliente.map((c, i) => (
                      <li key={i}>
                        {c.descricao} - R$ {c.valor} ({c.categoria})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-2"><strong>Total a pagar:</strong> R$ {total}</p>

              <div className="mt-2">
                <Botao texto="Finalizar Check-Out" onClick={() => finalizarCheckout(checkin)} />
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
