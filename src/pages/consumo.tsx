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
  id: number; // id numérico vindo do Prisma
  cliente: string;
  hospede: boolean;
  checkinId: number;
  status: string;
  criadoEm: string;
  subcomandas: Subcomanda[];
};

export default function ListaComandas() {
  const [comandas, setComandas] = useState<Consumo[]>([]);
  const router = useRouter();

  // Carrega comandas abertas ao montar componente
  useEffect(() => {
    carregarComandas();
  }, []);

  async function carregarComandas() {
    try {
      const res = await fetch('/api/consumo');
      if (!res.ok) throw new Error('Erro ao buscar comandas');
      const data: Consumo[] = await res.json();
      setComandas(data);
    } catch (err) {
      alert('Erro ao carregar comandas');
      console.error(err);
    }
  }

  // Cria nova comanda enviando dados mínimos que backend espera
  async function criarNova(tipo: 'cliente' | 'hospede') {
    const nome = prompt(
      tipo === 'hospede' ? 'Informe o nome do Hóspede:' : 'Informe o nome do Cliente:'
    );
    if (!nome || nome.trim() === '') return;

    const novaComanda = {
      cliente: nome.trim(),
      hospede: tipo === 'hospede',
      checkinId: 0,
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

  // Exclui comanda pelo id numérico
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

  // Calcula o total da comanda somando itens de todas subcomandas
  function calcularTotal(comanda: Consumo): number {
    return comanda.subcomandas.reduce((soma, sub) => {
      return (
        soma +
        sub.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
      );
    }, 0);
  }

  return (
    <Layout title="🧾 Comandas">
      <div className="max-w-3xl mx-auto space-y-6 text-black px-4">
        {/* Criar Nova Comanda */}
        <div className="bg-white p-6 rounded shadow text-center space-y-4">
          <h3 className="text-lg font-semibold">Criar Nova Comanda</h3>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Botao texto="🧍 Cliente Avulso" onClick={() => criarNova('cliente')} />
            <Botao texto="🏨 Hóspede da Pousada" onClick={() => criarNova('hospede')} />
          </div>
        </div>

        {/* Lista de Comandas */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Comandas em Aberto</h2>

          {comandas.length === 0 ? (
            <p className="text-gray-500">Nenhuma comanda aberta no momento.</p>
          ) : (
            <ul className="space-y-3">
              {comandas.map(c => (
                <li
                  key={c.id}
                  className="border p-4 rounded flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div
                    className="flex-1 hover:underline cursor-pointer"
                    onClick={() => router.push(`/comanda/${c.id}`)}
                  >
                    <p className="font-medium">
                      {c.hospede ? '🏨 Hóspede' : '🧍 Cliente'}: {c.cliente}
                    </p>
                    <p className="text-sm text-green-700 font-bold">
                      Total: R$ {calcularTotal(c).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => excluirComanda(c.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    🗑️ Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
