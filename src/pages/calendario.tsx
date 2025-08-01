'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';

// Nomes EXATOS como usados no banco
const chales = [
  'Chalé 1', 'Chalé 2', 'Chalé 3', 'Chalé 4', 'Chalé 5',
  'Chalé 6', 'Chalé 7', 'Chalé 8', 'Chalé 9', 'Chalé 10',
  'Casa Da Água', 'Chalé 12', 'Chalé 13', 'Chalé 14', 'Chalé Campeira'
];

type Fonte = 'reservado' | 'ocupado' | 'checkout';
interface Ocupacao {
  chale: string;
  de: number;
  ate: number;
  mes: number;
  ano: number;
  status: Fonte;
  nome?: string;
}
interface ReservaOuCheckin {
  chale: string;
  nome?: string;
  dataEntrada?: string;
  dataSaida?: string;
  entrada?: string;
  saida?: string;
}
interface Checkout {
  checkinId: string;
  chale: string;
  nome: string;
  dataSaidaReal: string;
}

export default function CalendarioPage() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Padroniza o nome do chalé pra comparar array/banco
  function normalizeChaleNome(str: string): string {
    if (!str) return '';
    // Remover acentos, lowercase, simplificar
    const limpa = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '');
    if (limpa.includes('campeira')) return 'Chalé Campeira';
    if (limpa.includes('casadaagua')) return 'Casa Da Água';
    // Padrão para "Chalé XX"
    if (limpa.startsWith('chale')) {
      const num = str.match(/\d+/);
      if (num && chales.includes('Chalé ' + num[0])) return 'Chalé ' + num[0];
    }
    // Exatamente igual?
    const encontrado = chales.find(c =>
      c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '') === limpa
    );
    return encontrado || str.trim();
  }

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const [reservasRes, checkinsRes] = await Promise.all([
          fetch('/api/reservas').then(res => res.json()),
          fetch('/api/checkin').then(res => res.json()),
        ]);
        let checkoutsRes: Checkout[] = [];
        try {
          let res = await fetch('/api/checkout');
          if (!res.ok) res = await fetch('/api/checkouts');
          if (res.ok) checkoutsRes = await res.json();
        } catch {
          checkoutsRes = [];
        }

        // Debug log
        // console.log('[RESERVAS]', reservasRes);

        const toOcupacao = (
          item: ReservaOuCheckin,
          status: Fonte
        ): Ocupacao | null => {
          const chaleNormalizado = normalizeChaleNome(item.chale || '');
          const entradaStr = item.dataEntrada || item.entrada;
          const saidaStr = item.dataSaida || item.saida;
          if (!entradaStr || !saidaStr) return null;
          const entrada = new Date(entradaStr);
          const saida = new Date(saidaStr);
          if (isNaN(entrada.getTime()) || isNaN(saida.getTime())) return null;
          return {
            chale: chaleNormalizado,
            de: entrada.getDate(),
            ate: saida.getDate() - 1,
            mes: entrada.getMonth(),
            ano: entrada.getFullYear(),
            status,
            nome: item.nome || undefined,
          };
        };

        const reservas: Ocupacao[] = reservasRes
          .map((r: ReservaOuCheckin) => toOcupacao(r, 'reservado'))
          .filter(Boolean) as Ocupacao[];

        const checkins: Ocupacao[] = checkinsRes
          .map((c: ReservaOuCheckin) => toOcupacao(c, 'ocupado'))
          .filter(Boolean) as Ocupacao[];

        const checkouts: Ocupacao[] = checkoutsRes
          .map((c: Checkout) => {
            const chaleNormalizado = normalizeChaleNome(c.chale);
            const saida = new Date(c.dataSaidaReal);
            return {
              chale: chaleNormalizado,
              de: saida.getDate(),
              ate: saida.getDate(),
              mes: saida.getMonth(),
              ano: saida.getFullYear(),
              status: 'checkout' as Fonte,
              nome: c.nome,
            };
          });

        setOcupacoes([...reservas, ...checkins, ...checkouts]);
      } catch (e) {
        setErro("Erro ao carregar dados do calendário. Verifique conexão e endpoints.");
        setOcupacoes([]);
      }
      setCarregando(false);
    };
    carregar();
  }, [mesAtual]);

  const diasDoMes = Array.from(
    { length: new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate() },
    (_, i) => i + 1
  );

  const getStatus = (chale: string, dia: number): { status: Fonte | 'livre', nomes: string[] } => {
    const ocupacoesDoDia = ocupacoes.filter(
      (o) =>
        o.chale === chale &&
        o.mes === mesAtual.getMonth() &&
        o.ano === mesAtual.getFullYear() &&
        dia >= o.de &&
        dia <= o.ate
    );
    if (ocupacoesDoDia.some((o) => o.status === 'checkout'))
      return { status: 'checkout', nomes: ocupacoesDoDia.filter(o => o.status === 'checkout').map(o => o.nome || '') };
    if (ocupacoesDoDia.some((o) => o.status === 'ocupado'))
      return { status: 'ocupado', nomes: ocupacoesDoDia.filter(o => o.status === 'ocupado').map(o => o.nome || '') };
    if (ocupacoesDoDia.some((o) => o.status === 'reservado'))
      return { status: 'reservado', nomes: ocupacoesDoDia.filter(o => o.status === 'reservado').map(o => o.nome || '') };
    return { status: 'livre', nomes: [] };
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

  const statusInfo = {
    livre: { bg: 'bg-white', text: 'text-gray-700', desc: 'Livre' },
    reservado: { bg: 'bg-yellow-400', text: 'text-yellow-900', desc: 'Reservado' },
    ocupado: { bg: 'bg-red-500', text: 'text-white', desc: 'Ocupado' },
    checkout: { bg: 'bg-green-200', text: 'text-green-900', desc: 'Check-out Realizado' },
  };

  return (
    <Layout title="Calendário de Ocupação">
      <div className="max-w-full py-6">
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-800">{nomeMes}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => mudarMes(-1)}
              className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded shadow border"
            >
              ◀ Mês Anterior
            </button>
            <button
              onClick={() => mudarMes(1)}
              className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded shadow border"
            >
              Próximo Mês ▶
            </button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-700 mb-5 flex-wrap">
          {Object.entries(statusInfo).map(([key, { bg, text, desc }]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${bg} border rounded`} />
              <span className={text}>{desc}</span>
            </div>
          ))}
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 mb-4 rounded">
            {erro}
          </div>
        )}

        <div className="overflow-auto border rounded-xl shadow bg-white">
          <table className="table-fixed min-w-[1100px] border-collapse text-center text-xs md:text-sm">
            <thead className="bg-gray-50 sticky top-0 z-20">
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
                    const { status, nomes } = getStatus(chale, dia);
                    const { bg, text, desc } = statusInfo[status];
                    return (
                      <td
                        key={`${chale}-${dia}`}
                        className={`border w-10 md:w-14 h-8 ${bg} ${text} hover:brightness-110 transition cursor-pointer rounded relative`}
                        title={`${chale} - Dia ${dia} - ${desc}${nomes.length ? ' - ' + nomes.join(', ') : ''}`}
                      >
                        {status === 'checkout' && (
                          <span title="Check-out realizado" className="text-lg font-bold">✓</span>
                        )}
                        {nomes.length > 0 && (
                          <span className="absolute inset-x-1 bottom-1 truncate text-[10px] text-gray-900 font-semibold">
                            {nomes.join(', ').slice(0, 16)}{nomes.join(', ').length > 16 && '...'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {carregando && (
            <div className="text-center p-3 text-blue-700 font-semibold bg-white">
              Carregando ocupação...
            </div>
          )}
          {!carregando && ocupacoes.length === 0 && (
            <div className="text-center p-3 text-gray-500 font-semibold bg-white">
              Nenhuma ocupação encontrada para este mês.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
