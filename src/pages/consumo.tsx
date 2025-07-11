import Layout from '@/components/layout/Layout';
import Botao from '@/components/ui/Botao';
import { useEffect, useState } from 'react';
import { db, Consumo, Subcomanda } from '@/utils/db';
import { useRouter } from 'next/router';

export default function ListaComandas() {
  const [comandas, setComandas] = useState<Consumo[]>([]);
  const router = useRouter();

  useEffect(() => {
    carregarComandas();
  }, []);

  const carregarComandas = async () => {
    const abertas = await db.consumos.where('status').equals('aberta').toArray();
    setComandas(abertas);
  };

  const criarNova = async (tipo: 'cliente' | 'hospede') => {
    const nome = prompt(
      tipo === 'hospede' ? 'Informe o nome do Hóspede:' : 'Informe o nome do Cliente:'
    );
    if (!nome || nome.trim() === '') return;

    const timestamp = Date.now();

    const novaComanda: Consumo = {
      id: timestamp,
      cliente: nome.trim(),
      checkinId: 0, // número válido
      hospede: tipo === 'hospede',
      status: 'aberta',
      criadoEm: new Date().toISOString(),
      subcomandas: [
        {
          id: `principal-${timestamp}`,
          nome: nome.trim(),
          itens: [],
          total: 0
        }
      ]
    };

    try {
      await db.consumos.add(novaComanda);
      setComandas((prev) => [...prev, novaComanda]);
      router.push(`/comanda/${novaComanda.id}`);
    } catch (err) {
      console.error('Erro ao criar comanda:', err);
      alert('❌ Erro ao criar comanda. Verifique o console para mais detalhes.');
    }
  };

  const excluirComanda = async (id: number) => {
    const confirmar = confirm(
      'Tem certeza que deseja excluir esta comanda?\nEsta ação não pode ser desfeita.'
    );
    if (!confirmar) return;

    await db.consumos.delete(id);
    setComandas((prev) => prev.filter((c) => c.id !== id));
  };

  const calcularTotal = (comanda: Consumo): number => {
    return comanda.subcomandas.reduce((soma, sub) => {
      return (
        soma +
        sub.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
      );
    }, 0);
  };

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
              {comandas.map((c) => (
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
