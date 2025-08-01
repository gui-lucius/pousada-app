import Layout from '@/components/layout/Layout';
import Botao from '@/components/ui/Botao';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type Subcomanda = {
  id: string;
  nome: string;
  itens: { preco: number; quantidade: number }[];
  total: number;
};

type Consumo = {
  id: number;
  cliente: string;
  hospede: boolean;
  checkinId: number | null;
  status: string;
  criadoEm: string;
  subcomandas: Subcomanda[];
};

export default function ListaComandas() {
  const [comandas, setComandas] = useState<Consumo[]>([]);
  const router = useRouter();

  useEffect(() => {
    carregarComandas();
  }, []);

  async function carregarComandas() {
    try {
      const res = await fetch('/api/consumo');
      if (!res.ok) throw new Error('Erro ao buscar comandas');
      const data: Consumo[] = await res.json();
      // Só exibe as comandas abertas
      setComandas(data.filter(c => c.status === 'aberta'));
    } catch (err) {
      alert('Erro ao carregar comandas');
      console.error(err);
    }
  }

  async function criarNovaCliente() {
    const nome = prompt('Informe o nome do Cliente:');
    if (!nome || nome.trim() === '') return;
    const novaComanda = {
      cliente: nome.trim(),
      hospede: false,
      checkinId: null,
      subcomandas: [
        {
          id: `principal-${Date.now()}`,
          nome: nome.trim(),
          itens: [],
          total: 0,
        },
      ],
    };
    try {
      const res = await fetch('/api/consumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaComanda),
      });
      if (!res.ok) throw new Error('Erro ao criar comanda');
      const criada: Consumo = await res.json();
      setComandas(prev => [...prev, criada]);
      router.push(`/comanda/${criada.id}`);
    } catch (err) {
      alert('Erro ao criar comanda');
      console.error(err);
    }
  }

  async function excluirComanda(id: number) {
    const confirmar = confirm(
      'Tem certeza que deseja excluir esta comanda?\nEsta ação não pode ser desfeita.'
    );
    if (!confirmar) return;

    try {
      const res = await fetch('/api/consumo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Erro ao excluir comanda');
      setComandas(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Erro ao excluir comanda');
      console.error(err);
    }
  }

  function calcularTotal(comanda: Consumo): number {
    return comanda.subcomandas.reduce((soma, sub) => (
      soma + sub.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
    ), 0);
  }

  // Separar por tipo
  const comandasHospedes = comandas.filter(c => c.hospede);
  const comandasAvulsas = comandas.filter(c => !c.hospede);

  return (
    <Layout title="🧾 Comandas">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Header e Ação */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Comandas</h1>
            <span className="text-gray-500 text-sm">
              Visualize e gerencie as comandas ativas do sistema.
            </span>
          </div>
          <Botao
            texto="🧍 Nova Comanda Avulsa"
            onClick={criarNovaCliente}
            className="px-6 py-2 font-semibold rounded-lg shadow hover:shadow-md bg-blue-600 text-white hover:bg-blue-700 transition"
          />
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">
          <span className="font-bold">Dica:</span> Comandas de hóspedes são criadas automaticamente ao realizar o check-in.
        </div>

        {/* Cards agrupados */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hóspedes */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Hóspedes</span>
              Comandas de Hóspedes
            </h2>
            {comandasHospedes.length === 0 ? (
              <div className="text-gray-400 py-6 text-center border rounded-lg">Nenhuma comanda de hóspede aberta.</div>
            ) : (
              <ul className="space-y-3">
                {comandasHospedes.map(c => (
                  <li
                    key={c.id}
                    className="bg-white rounded-xl shadow flex flex-col sm:flex-row items-center sm:justify-between p-5 border hover:ring-2 ring-blue-400 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => router.push(`/comanda/${c.id}`)}>
                      <div className="w-10 h-10 bg-blue-100 text-blue-800 flex items-center justify-center rounded-full text-xl font-bold">
                        {c.cliente.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-base text-gray-800">{c.cliente}</div>
                        <div className="text-xs text-gray-500">Criada em: {new Date(c.criadoEm).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-bold">
                        R$ {calcularTotal(c).toFixed(2)}
                      </span>
                      <button
                        onClick={() => excluirComanda(c.id)}
                        className="ml-2 text-red-600 hover:bg-red-100 rounded p-1 transition"
                        title="Excluir comanda"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Avulsos */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Avulsos</span>
              Comandas de Clientes Avulsos
            </h2>
            {comandasAvulsas.length === 0 ? (
              <div className="text-gray-400 py-6 text-center border rounded-lg">Nenhuma comanda avulsa aberta.</div>
            ) : (
              <ul className="space-y-3">
                {comandasAvulsas.map(c => (
                  <li
                    key={c.id}
                    className="bg-white rounded-xl shadow flex flex-col sm:flex-row items-center sm:justify-between p-5 border hover:ring-2 ring-yellow-400 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => router.push(`/comanda/${c.id}`)}>
                      <div className="w-10 h-10 bg-yellow-100 text-yellow-800 flex items-center justify-center rounded-full text-xl font-bold">
                        {c.cliente.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-base text-gray-800">{c.cliente}</div>
                        <div className="text-xs text-gray-500">Criada em: {new Date(c.criadoEm).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-bold">
                        R$ {calcularTotal(c).toFixed(2)}
                      </span>
                      <button
                        onClick={() => excluirComanda(c.id)}
                        className="ml-2 text-red-600 hover:bg-red-100 rounded p-1 transition"
                        title="Excluir comanda"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
