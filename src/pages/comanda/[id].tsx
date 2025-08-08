'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Botao from '@/components/ui/Botao';

export default function ComandaDetalhes() {
  const router = useRouter();
  const { id } = router.query;

  const [comanda, setComanda] = useState<any>(null);
  const [precos, setPrecos] = useState<any>(null);

  const [subcomandaSelecionadaId, setSubcomandaSelecionadaId] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const carregar = async () => {
      const resComanda = await fetch(`/api/consumo?id=${id}`);
      const comandaDb = await resComanda.json();
      const resPrecos = await fetch('/api/precos');
      const precosDb = await resPrecos.json();

      setComanda({
        ...comandaDb,
        subcomandas: Array.isArray(comandaDb.subcomandas) ? comandaDb.subcomandas : [],
      });
      setPrecos(precosDb);
    };
    carregar();
  }, [id]);

  const atualizarComanda = async (nova: any) => {
    const atualizada = {
      ...nova,
      subcomandas: Array.isArray(nova.subcomandas) ? nova.subcomandas : [],
      updatedAt: new Date().toISOString(), // <---- TROQUE AQUI
    };
    await fetch('/api/consumo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atualizada),
    });
    setComanda(atualizada);
  };

  const calcularTotal = (itens: any[]) =>
    itens.reduce((acc, i) => acc + (i.pago ? 0 : i.preco * i.quantidade), 0);

  // --- UI ----------------------------------------------------------------
  if (!comanda || !precos || !precos.categoriasExtras)
    return <Layout title="Carregando...">Carregando comanda...</Layout>;

  return (
    <Layout title={`🧾 Comanda do ${comanda.subcomandas?.[0]?.nome || comanda.cliente}`}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-black">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <span className="text-blue-600">🧾</span>
              Comanda de <span className="text-blue-800">{comanda.subcomandas?.[0]?.nome || comanda.cliente}</span>
            </h1>
            <span className={`inline-block text-xs rounded px-2 py-1 font-medium ${
              comanda.status === 'aberta'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}>
              Status: {comanda.status}
            </span>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="bg-blue-600 text-white rounded-lg px-4 py-2 text-lg font-bold shadow-sm">
              Total: R$ {(comanda.subcomandas || []).reduce((t: number, s: any) => t + s.total, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pessoas na Comanda */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">👥 Pessoas na Comanda</h2>
          <div className="flex flex-wrap gap-4 mb-3">
            {(comanda.subcomandas || []).map((sub: any) => (
              <div
                key={sub.id}
                className={`flex items-center px-3 py-2 rounded-lg shadow border gap-2 cursor-pointer transition
                  ${subcomandaSelecionadaId === sub.id
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-gray-50 hover:bg-blue-50 border-gray-200'
                  }`
                }
                onClick={() => setSubcomandaSelecionadaId(sub.id)}
              >
                <span className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold">
                  {sub.nome.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{sub.nome}</span>
                {sub.itens.length === 0 && (
                  <button
                    title="Remover pessoa"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(`Remover ${sub.nome} da comanda?`)) return;
                      await atualizarComanda({
                        ...comanda,
                        subcomandas: (comanda.subcomandas || []).filter((s: any) => s.id !== sub.id),
                      });
                      setSubcomandaSelecionadaId('');
                    }}
                    className="text-red-600 ml-2 hover:bg-red-100 rounded px-1"
                  >✕</button>
                )}
              </div>
            ))}
            {/* Adicionar pessoa */}
            <button
              onClick={async () => {
                const comTodosPagos = {
                  ...comanda,
                  subcomandas: (comanda.subcomandas || []).map((sub: any) => ({
                    ...sub,
                    itens: sub.itens.map((item: any) => ({ ...item, pago: true })),
                  })),
                  status: 'paga',
                };

                if (comanda.tipo === 'comanda_avulsa') {
                  const itensParaFaturamento: any[] = [];
                  (comanda.subcomandas || []).forEach((sub: any) => {
                    sub.itens.forEach((item: any) => {
                      itensParaFaturamento.push({
                        categoria: item.categoria || 'Sem categoria',
                        produto: item.produto || item.nome,
                        quantidade: item.quantidade,
                        valorTotal: item.preco * item.quantidade,
                      });
                    });
                  });

                  await fetch('/api/faturamento', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tipo: 'comanda_avulsa',
                      formaPagamento: 'Dinheiro',
                      itensComanda: itensParaFaturamento,
                      nomeHospede: comanda.cliente,
                      criadoEm: new Date(),
                    }),
                  });
                }

                await atualizarComanda(comTodosPagos);

                alert('Comanda finalizada!');
                router.push('/consumo');
              }}

              className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 flex items-center gap-2 font-medium"
            >
              <span className="text-xl">+</span> Adicionar Pessoa
            </button>
          </div>
        </div>

        {/* Stepper de Adição de Itens */}
        {subcomandaSelecionadaId && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-3">Adicionar Consumo</h2>
            {/* Categoria */}
            <div className="mb-3">
              <div className="font-medium text-gray-600 mb-2">Escolha uma categoria:</div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(precos.categoriasExtras)
                  .filter(([, cat]: any) => cat.usarEmComanda)
                  .map(([nome, cat]: any) => (
                    <button
                      key={nome}
                      onClick={() => setCategoriaSelecionada(nome)}
                      className={`rounded-lg px-4 py-2 shadow transition border flex flex-col items-center min-w-[110px] ${
                        categoriaSelecionada === nome
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="font-medium">{nome}</span>
                    </button>
                  ))}
              </div>
            </div>
            {/* Itens */}
            {categoriaSelecionada && (
              <div>
                <div className="font-medium text-gray-600 mb-2">Selecione os itens:</div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {precos?.categoriasExtras[categoriaSelecionada]?.itens.map((item: any) => (
                    <div key={item.nome} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                      <div className="font-semibold">{item.nome}</div>
                      <div className="text-sm text-gray-500">R$ {item.preco.toFixed(2)}</div>
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
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded"
                            type="button"
                          >
                            -
                          </button>
                          <span className="w-5 text-center">{quantidades[item.nome] || 0}</span>
                          <button
                            onClick={() =>
                              setQuantidades((prev) => ({
                                ...prev,
                                [item.nome]: (prev[item.nome] || 0) + 1,
                              }))
                            }
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded"
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4 text-right">
                  <Botao texto="Adicionar à Comanda"
                    onClick={async () => {
                      if (!comanda || !precos || !categoriaSelecionada || !subcomandaSelecionadaId) return;
                      const subIndex = (comanda.subcomandas || []).findIndex((s: any) => s.id === subcomandaSelecionadaId);
                      if (subIndex === -1) return;
                      const categoria = precos.categoriasExtras[categoriaSelecionada];
                      if (!categoria) return;
                      const novosItens = categoria.itens
                        .filter((item: any) => quantidades[item.nome] && quantidades[item.nome] > 0)
                        .map((item: any) => ({
                          produto: item.nome, // <-- mudar de nome para produto
                          preco: item.preco,
                          quantidade: quantidades[item.nome],
                          valorTotal: item.preco * quantidades[item.nome],
                          categoria: categoriaSelecionada,
                          pago: false,
                        }));

                      // --- NOVO: Atualizar via API
                      const subcomandas = [...(comanda.subcomandas || [])];
                      const itensAtualizados = [...subcomandas[subIndex].itens, ...novosItens];
                      subcomandas[subIndex] = {
                        ...subcomandas[subIndex],
                        itens: itensAtualizados,
                        total: calcularTotal(itensAtualizados),
                      };

                      // Espera o PUT terminar antes de atualizar o state local
                      await atualizarComanda({ ...comanda, subcomandas });

                      setCategoriaSelecionada('');
                      setQuantidades({});
                    }}
                  />

                </div>
              </div>
            )}
          </div>
        )}

        {/* Itens das Pessoas */}
        {(comanda.subcomandas || []).map((sub: any, subIndex: number) => (
          <div key={sub.id} className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="bg-blue-100 rounded-full px-2 py-1 text-blue-800 text-xs">{sub.nome}</span>
              <span className="text-gray-400 font-normal text-sm">(itens)</span>
            </h3>
            {sub.itens.length === 0 ? (
              <p className="text-gray-400 py-2">Nenhum item adicionado.</p>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-separate [border-spacing:0.5rem]">
                  <thead>
                    <tr>
                      <th className="text-left">Produto</th>
                      <th>Preço</th>
                      <th>Qtd.</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.itens.map((item: any, itemIndex: number) => (
                      <tr key={itemIndex}
                        className={item.pago ? "bg-gray-100 text-gray-400 line-through" : "bg-white"}>
                        <td>
                          <input
                            value={item.nome || item.produto}
                            disabled={item.pago}
                            onChange={(e) =>
                              atualizarItem(subIndex, itemIndex, 'nome', e.target.value)
                            }
                            className="border px-2 py-1 rounded w-32"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.preco}
                            disabled={item.pago}
                            onChange={(e) =>
                              atualizarItem(subIndex, itemIndex, 'preco', Number(e.target.value))
                            }
                            className="border px-2 py-1 rounded w-20"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantidade}
                            disabled={item.pago}
                            onChange={(e) =>
                              atualizarItem(subIndex, itemIndex, 'quantidade', Number(e.target.value))
                            }
                            className="border px-2 py-1 rounded w-16"
                          />
                        </td>
                        <td className="text-green-700 font-bold text-right pr-4">
                          R$ {(item.preco * item.quantidade).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => alternarPago(subIndex, itemIndex)}
                            className={`text-xs font-bold rounded px-2 py-1 ${
                              item.pago
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {item.pago ? 'Pago' : 'Pendente'}
                          </button>
                        </td>
                        <td>
                          {!item.pago && (
                            <button
                              onClick={() => removerItem(subIndex, itemIndex)}
                              className="text-red-500 hover:text-red-700 text-xl"
                              title="Remover item"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-right font-semibold text-green-700 mt-2">
              Total: R$ {sub.total.toFixed(2)}
            </p>
          </div>
        ))}

        {/* Finalizar Comanda */}
        {comanda.status !== 'paga' && (
          <div className="flex justify-center">
            <Botao
              texto="✅ Fechar Comanda"
              className="w-full md:w-auto"
              onClick={async () => {
                const comTodosPagos = {
                  ...comanda,
                  subcomandas: (comanda.subcomandas || []).map((sub: any) => ({
                    ...sub,
                    itens: sub.itens.map((item: any) => ({ ...item, pago: true })),
                  })),
                  status: 'paga',
                };

                if (comanda.tipo === 'comanda_avulsa') {
                  const itensParaFaturamento: any[] = [];
                  (comanda.subcomandas || []).forEach((sub: any) => {
                    sub.itens.forEach((item: any) => {
                      itensParaFaturamento.push({
                        categoria: item.categoria || 'Sem categoria',
                        produto: item.produto || item.nome,
                        quantidade: item.quantidade,
                        valorTotal: item.preco * item.quantidade,
                      });
                    });
                  });

                  await fetch('/api/faturamento', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tipo: 'comanda_avulsa',
                      formaPagamento: 'Dinheiro',
                      itensComanda: itensParaFaturamento,
                      nomeHospede: comanda.cliente,
                      criadoEm: new Date(),
                    }),
                  });
                }

                // Apenas atualiza a comanda como paga
                await atualizarComanda(comTodosPagos);

                alert(
                  comanda.tipo === 'comanda_avulsa'
                    ? 'Comanda finalizada e lançada no faturamento!'
                    : 'Comanda de hóspede finalizada! (lançamento será no checkout)'
                );
                router.push('/consumo');
              }}
            />
          </div>
        )}

        {/* Voltar */}
        <div className="text-center pt-6">
          <Botao texto="🔙 Voltar" onClick={() => router.push('/consumo')} />
        </div>
      </div>
    </Layout>
  );

  // -------- Funções auxiliares antigas --------------------
  function atualizarItem(subIndex: number, itemIndex: number, campo: string, valor: any) {
    if (!comanda) return;
    const novasSubcomandas = [...(comanda.subcomandas || [])];
    const item = { ...novasSubcomandas[subIndex].itens[itemIndex] };
    if (item.pago) return;
    item[campo] = valor;
    novasSubcomandas[subIndex].itens[itemIndex] = item;
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);
    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  }

  function removerItem(subIndex: number, itemIndex: number) {
    if (!comanda) return;
    const item = (comanda.subcomandas || [])[subIndex].itens[itemIndex];
    if (item.pago) return;
    const novasSubcomandas = [...(comanda.subcomandas || [])];
    novasSubcomandas[subIndex].itens.splice(itemIndex, 1);
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);
    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  }

  function alternarPago(subIndex: number, itemIndex: number) {
    if (!comanda) return;
    const novasSubcomandas = [...(comanda.subcomandas || [])];
    const item = { ...novasSubcomandas[subIndex].itens[itemIndex] };
    item.pago = !item.pago;
    novasSubcomandas[subIndex].itens[itemIndex] = item;
    novasSubcomandas[subIndex].total = calcularTotal(novasSubcomandas[subIndex].itens);
    atualizarComanda({ ...comanda, subcomandas: novasSubcomandas });
  }
}
