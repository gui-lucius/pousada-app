'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Botao from '@/components/ui/Botao';
import { db, Consumo, PrecosConfig, ItemComanda } from '@/utils/db';

export default function ComandaDetalhes() {
  const router = useRouter();
  const { id } = router.query;

  const [comanda, setComanda] = useState<Consumo | null>(null);
  const [precos, setPrecos] = useState<PrecosConfig | null>(null);

  const [subcomandaSelecionadaId, setSubcomandaSelecionadaId] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;
    const carregar = async () => {
      const comandaDb = await db.consumos.get(Number(id));
      const precosDb = await db.precos.get('config');
      if (comandaDb) setComanda(comandaDb);
      if (precosDb) setPrecos(precosDb);
    };
    carregar();
  }, [id]);

  const atualizarComanda = async (nova: Consumo) => {
    await db.consumos.put(nova);
    setComanda(nova);
  };

  const calcularTotal = (itens: ItemComanda[]) =>
    itens.reduce((acc, i) => acc + (i.pago ? 0 : i.preco * i.quantidade), 0);

  const adicionarItensSelecionados = () => {
    if (!comanda || !precos || !categoriaSelecionada || !subcomandaSelecionadaId) return;

    const subIndex = comanda.subcomandas.findIndex(s => s.id === subcomandaSelecionadaId);
    if (subIndex === -1) return;

    const categoria = precos.categoriasExtras[categoriaSelecionada];
    if (!categoria) return;

    const novosItens: ItemComanda[] = categoria.itens
      .filter(item => quantidades[item.nome] && quantidades[item.nome] > 0)
      .map(item => ({
        nome: item.nome,
        preco: item.preco,
        quantidade: quantidades[item.nome],
        categoria: categoriaSelecionada,
        pago: false,
      }));

    const subcomandas = [...comanda.subcomandas];
    const itensAtualizados = [...subcomandas[subIndex].itens, ...novosItens];

    subcomandas[subIndex] = {
      ...subcomandas[subIndex],
      itens: itensAtualizados,
      total: calcularTotal(itensAtualizados),
    };

    atualizarComanda({ ...comanda, subcomandas });
    setCategoriaSelecionada('');
    setQuantidades({});
  };

  const atualizarItem = <K extends keyof ItemComanda>(
    subIndex: number,
    itemIndex: number,
    campo: K,
    valor: ItemComanda[K]
  ) => {
    if (!comanda) return;

    const novasSubcomandas = [...comanda.subcomandas];
    const item = { ...novasSubcomandas[subIndex].itens[itemIndex] };

    if (item.pago) return;

    item[campo] = valor;
    novasSubcomandas[subIndex].itens[itemIndex] = item;
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);

    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  };

  const removerItem = (subIndex: number, itemIndex: number) => {
    if (!comanda) return;

    const item = comanda.subcomandas[subIndex].itens[itemIndex];
    if (item.pago) return;

    const novasSubcomandas = [...comanda.subcomandas];
    novasSubcomandas[subIndex].itens.splice(itemIndex, 1);
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);

    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  };

  const alternarPago = (subIndex: number, itemIndex: number) => {
    if (!comanda) return;

    const novasSubcomandas = [...comanda.subcomandas];
    const item = { ...novasSubcomandas[subIndex].itens[itemIndex] };

    item.pago = !item.pago;
    novasSubcomandas[subIndex].itens[itemIndex] = item;
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);

    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  };

  if (!comanda) {
    return <Layout title="Carregando...">Carregando comanda...</Layout>;
  }

  

  return (
    <Layout title={`🧾 Comanda do ${comanda.cliente}`}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-black">

        <div className="bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-2">🧾 Comanda do {comanda.cliente}</h1>
          <p><strong>Status:</strong> {comanda.status}</p>
        </div>

        {/* Etapa 1: Selecionar Pessoa */}
        <div className="bg-white rounded shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">1️⃣ Escolha a Pessoa</h2>
          <div className="flex flex-wrap gap-3">
            {comanda.subcomandas.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <button
                  onClick={() => setSubcomandaSelecionadaId(sub.id)}
                  className={`px-4 py-2 rounded border ${
                    subcomandaSelecionadaId === sub.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  👤 {sub.nome}
                </button>

                {sub.itens.length === 0 && (
                  <button
                    title="Remover"
                    onClick={async () => {
                      if (!confirm(`Remover ${sub.nome} da comanda?`)) return
                      const nova = {
                        ...comanda,
                        subcomandas: comanda.subcomandas.filter((s) => s.id !== sub.id),
                      }
                      await db.consumos.put(nova)
                      setComanda(nova)
                      setSubcomandaSelecionadaId('')
                    }}
                    className="text-red-600 hover:text-red-800 text-xl"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}


            <button
              onClick={async () => {
                const nome = prompt('Digite o nome da nova pessoa:')
                if (!nome || !comanda) return

                const novaSub = {
                  id: Date.now().toString(),
                  nome,
                  itens: [],
                  total: 0
                }

                const novaComanda = {
                  ...comanda,
                  subcomandas: [...comanda.subcomandas, novaSub]
                }

                await db.consumos.put(novaComanda)
                setComanda(novaComanda)
                setSubcomandaSelecionadaId(novaSub.id)
              }}
              className="px-4 py-2 mt-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
            >
              ➕ Adicionar Pessoa à Comanda
            </button>

          </div>
        </div>

        {/* Etapa 2: Escolher Categoria */}
        {subcomandaSelecionadaId && precos && (
          <div className="bg-white rounded shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">2️⃣ Escolha a Categoria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(precos.categoriasExtras)
                .filter(([, cat]) => cat.usarEmComanda)

                .map(([nome, cat]) => (
                  <button
                    key={nome}
                    onClick={() => setCategoriaSelecionada(nome)}
                    className={`border p-4 rounded text-center ${
                      categoriaSelecionada === nome
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-2xl">{cat.emoji}</div>
                    <div className="font-medium">{nome}</div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Etapa 3: Selecionar Itens */}
        {categoriaSelecionada && (
          <div className="bg-white rounded shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">3️⃣ Itens da Categoria</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {precos?.categoriasExtras[categoriaSelecionada]?.itens.map((item) => (
                <div key={item.nome} className="border rounded p-4">
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-sm text-gray-500">R$ {item.preco.toFixed(2)}</p>
                  {precos?.categoriasExtras[categoriaSelecionada]?.porKg ? (
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Peso (kg)"
                      value={quantidades[item.nome] || ''}
                      onChange={(e) =>
                        setQuantidades((prev) => ({
                          ...prev,
                          [item.nome]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full mt-2 border px-2 py-1 rounded"
                    />
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          setQuantidades((prev) => ({
                            ...prev,
                            [item.nome]: Math.max((prev[item.nome] || 0) - 1, 0),
                          }))
                        }
                        className="px-2 py-1 bg-red-200 rounded"
                      >
                        -
                      </button>
                      <span>{quantidades[item.nome] || 0}</span>
                      <button
                        onClick={() =>
                          setQuantidades((prev) => ({
                            ...prev,
                            [item.nome]: (prev[item.nome] || 0) + 1,
                          }))
                        }
                        className="px-2 py-1 bg-green-200 rounded"
                      >
                        +
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>

            <div className="pt-4 text-right">
              <Botao texto="Adicionar à Comanda" onClick={adicionarItensSelecionados} />
            </div>
          </div>
        )}

        {/* Exibir Subcomandas */}
        {comanda.subcomandas.map((sub, subIndex) => (
          <div key={sub.id} className="bg-white rounded shadow p-6 space-y-4">
            <h3 className="text-lg font-bold">📋 Itens de {sub.nome}</h3>

            {sub.itens.length === 0 ? (
              <p className="text-gray-500">Nenhum item adicionado.</p>
            ) : (
              <div className="space-y-2">
                {sub.itens.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-3 items-center border rounded p-2 ${
                      item.pago ? 'bg-gray-100 text-gray-500 line-through' : ''
                    }`}
                  >
                    <input
                      value={item.nome}
                      disabled={item.pago}
                      onChange={(e) =>
                        atualizarItem(subIndex, itemIndex, 'nome', e.target.value)
                      }
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={item.preco}
                      disabled={item.pago}
                      onChange={(e) =>
                        atualizarItem(subIndex, itemIndex, 'preco', Number(e.target.value))
                      }
                      className="border px-2 py-1 rounded"
                    />
                    <input
                      type="number"
                      value={item.quantidade}
                      disabled={item.pago}
                      onChange={(e) =>
                        atualizarItem(subIndex, itemIndex, 'quantidade', Number(e.target.value))
                      }
                      className="border px-2 py-1 rounded"
                    />
                    <div className="text-right font-medium text-green-700 pr-2">
                      R$ {(item.preco * item.quantidade).toFixed(2)}
                    </div>
                    <button
                      onClick={() => !item.pago && removerItem(subIndex, itemIndex)}
                      className="text-red-500 hover:text-red-700 text-xl"
                      title="Remover item"
                      disabled={item.pago}
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => alternarPago(subIndex, itemIndex)}
                      className={`text-sm font-medium ${
                        item.pago
                          ? 'text-yellow-600 hover:underline'
                          : 'text-green-600 hover:underline'
                      }`}
                    >
                      {item.pago ? '↩️ Reabrir' : '💰 Marcar como Pago'}
                    </button>

                  </div>
                ))}
              </div>
            )}

            <p className="text-right font-semibold text-green-700">
              Total em aberto: R$ {sub.total.toFixed(2)}
            </p>
          </div>
        ))}

        {comanda.status !== 'paga' && (
          <div className="text-center">
            <Botao
              texto="✅ Fechar Comanda"
              onClick={async () => {
                const comTodosPagos = {
                  ...comanda,
                  subcomandas: comanda.subcomandas.map((sub) => ({
                    ...sub,
                    itens: sub.itens.map((item) => ({ ...item, pago: true })),
                  })),
                status: 'paga' as 'paga',

                };

                await db.consumos.put(comTodosPagos);
                setComanda(comTodosPagos);
                alert('Comanda finalizada! Todos os itens foram marcados como pagos.');
              }}
            />
          </div>
        )}


        <div className="text-center pt-4">
          <Botao texto="🔙 Voltar" onClick={() => router.push('/consumo')} />
        </div>
      </div>
    </Layout>
  );
}
