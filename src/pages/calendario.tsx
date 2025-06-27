import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';

const chales = [
  'Chalé 1', 'Chalé 2', 'Chalé 3', 'Chalé 4', 'Chalé 5',
  'Chalé 6', 'Chalé 7', 'Chalé 8', 'Chalé 9', 'Chalé 10',
  'Casa Da Água', 'Chalé 12', 'Chalé 13', 'Chalé Campeira'
];

interface Ocupacao {
  chale: string;
  de: number;
  ate: number;
  mes: number;
  ano: number;
  status: 'reservado' | 'ocupado';
}

export default function CalendarioPage() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([]);

  useEffect(() => {
    const reservas = JSON.parse(localStorage.getItem('pousada_reservas') || '[]');
    const checkins = JSON.parse(localStorage.getItem('pousada_checkins') || '[]');

    const toOcupacao = (item: any, status: 'reservado' | 'ocupado'): Ocupacao | null => {
      try {
        const entrada = new Date(item.dataEntrada || item.entrada);
        const saida = new Date(item.dataSaida || item.saida);
        return {
          chale: item.chale,
          de: entrada.getDate(),
          ate: saida.getDate(),
          mes: entrada.getMonth(),
          ano: entrada.getFullYear(),
          status,
        };
      } catch {
        return null;
      }
    };

    const todas = [
      ...reservas.map((r: any) => toOcupacao(r, 'reservado')),
      ...checkins.map((c: any) => toOcupacao(c, 'ocupado')),
    ].filter(Boolean) as Ocupacao[];

    setOcupacoes(todas);
  }, [mesAtual]);

  const diasDoMes = Array.from(
    { length: new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate() },
    (_, i) => i + 1
  );

  const getStatus = (chale: string, dia: number): 'livre' | 'reservado' | 'ocupado' => {
    const ocupacoesDoDia = ocupacoes.filter(
      o =>
        o.chale === chale &&
        o.mes === mesAtual.getMonth() &&
        o.ano === mesAtual.getFullYear() &&
        dia >= o.de &&
        dia <= o.ate
    );

    if (ocupacoesDoDia.find(o => o.status === 'ocupado')) return 'ocupado';
    if (ocupacoesDoDia.find(o => o.status === 'reservado')) return 'reservado';
    return 'livre';
  };

  const mudarMes = (offset: number) => {
    const novo = new Date(mesAtual);
    novo.setMonth(novo.getMonth() + offset);
    setMesAtual(novo);
  };

  const nomeMes = mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Layout title="Calendário de Ocupação">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="font-bold text-xl text-gray-800">{nomeMes}</h2>
        <div className="flex gap-2">
          <button onClick={() => mudarMes(-1)} className="px-3 py-1 bg-gray-300 rounded text-sm">
            ◀ Mês Anterior
          </button>
          <button onClick={() => mudarMes(1)} className="px-3 py-1 bg-gray-300 rounded text-sm">
            Próximo Mês ▶
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm mb-4 text-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border" /> Livre
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border" /> Reservado
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border" /> Ocupado
        </div>
      </div>

      <div className="overflow-auto">
        <table className="table-fixed border border-gray-300 text-center text-sm text-gray-800">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2 sticky left-0 z-10 bg-gray-200">Dia</th>
              {chales.map(chale => (
                <th key={chale} className="border p-2">{chale}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diasDoMes.map(dia => (
              <tr key={dia}>
                <td className="border px-2 py-1 sticky left-0 z-10 bg-gray-50">{dia}</td>
                {chales.map(chale => {
                  const status = getStatus(chale, dia);
                  const bg =
                    status === 'ocupado'
                      ? 'bg-red-500'
                      : status === 'reservado'
                      ? 'bg-yellow-400'
                      : 'bg-white';

                  return (
                    <td
                      key={chale + dia}
                      className={`border w-16 h-8 ${bg} hover:opacity-75 cursor-default`}
                      title={`${chale} - Dia ${dia} - ${status}`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
