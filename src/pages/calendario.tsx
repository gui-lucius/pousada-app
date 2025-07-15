import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { db } from '@/utils/db';

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

interface ReservaOuCheckin {
  chale: string;
  dataEntrada?: string;
  dataSaida?: string;
  entrada?: string;
  saida?: string;
}

export default function CalendarioPage() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([]);

  useEffect(() => {
    const carregar = async () => {
      const reservas = await db.reservas.toArray();
      const checkins = await db.checkins.toArray();

      const toOcupacao = (
        item: ReservaOuCheckin,
        status: 'reservado' | 'ocupado'
      ): Ocupacao | null => {
        try {
          const entrada = new Date(item.dataEntrada || item.entrada || '');
          const saida = new Date(item.dataSaida || item.saida || '');
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
        ...reservas.map((r) => toOcupacao(r, 'reservado')),
        ...checkins.map((c) => toOcupacao(c, 'ocupado')),
      ].filter(Boolean) as Ocupacao[];

      setOcupacoes(todas);
    };

    carregar();
  }, [mesAtual]);

  const diasDoMes = Array.from(
    { length: new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate() },
    (_, i) => i + 1
  );

  const getStatus = (chale: string, dia: number): 'livre' | 'reservado' | 'ocupado' => {
    const ocupacoesDoDia = ocupacoes.filter(
      (o) =>
        o.chale === chale &&
        o.mes === mesAtual.getMonth() &&
        o.ano === mesAtual.getFullYear() &&
        dia >= o.de &&
        dia <= o.ate
    );

    if (ocupacoesDoDia.some((o) => o.status === 'ocupado')) return 'ocupado';
    if (ocupacoesDoDia.some((o) => o.status === 'reservado')) return 'reservado';
    return 'livre';
  };

  const mudarMes = (offset: number) => {
    const novo = new Date(mesAtual);
    novo.setMonth(novo.getMonth() + offset);
    setMesAtual(novo);
  };

  const nomeMes = mesAtual.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).replace(/^./, (str) => str.toUpperCase());

  return (
    <Layout title="Calendário de Ocupação">
      <div className="mb-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{nomeMes}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => mudarMes(-1)}
              className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
            >
              ◀ Mês Anterior
            </button>
            <button
              onClick={() => mudarMes(1)}
              className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded"
            >
              Próximo Mês ▶
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex gap-4 text-sm text-gray-700 mb-4">
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

        {/* Tabela de ocupações */}
        <div className="overflow-auto border rounded shadow-sm">
          <table className="table-fixed min-w-[900px] border-collapse text-center text-sm text-gray-800">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                <th className="border p-2 sticky left-0 z-30 bg-gray-100">Dia</th>
                {chales.map((chale) => (
                  <th key={chale} className="border p-2 whitespace-nowrap">{chale}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diasDoMes.map((dia) => (
                <tr key={dia}>
                  <td className="border px-2 py-1 sticky left-0 bg-white z-10 font-medium">{dia}</td>
                  {chales.map((chale) => {
                    const status = getStatus(chale, dia);
                    const bg =
                      status === 'ocupado'
                        ? 'bg-red-500'
                        : status === 'reservado'
                        ? 'bg-yellow-400'
                        : 'bg-white';

                    return (
                      <td
                        key={`${chale}-${dia}`}
                        className={`border w-12 h-8 ${bg} hover:opacity-75 transition cursor-default`}
                        title={`${chale} - Dia ${dia} - ${status}`}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
