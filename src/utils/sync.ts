import { db } from './db';
import { uploadArquivoJson, baixarUltimoArquivo } from './drive';

let rodando = false;

// Garante um ID único por dispositivo (salvo no localStorage)
const DEVICE_ID = localStorage.getItem('pousada_device_id') || (() => {
  const novo = `device-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem('pousada_device_id', novo);
  return novo;
})();

function gerarNomeArquivo(): string {
  return `backup-pousada-${Date.now()}-${DEVICE_ID}.json`;
}

/**
 * Sincroniza o IndexedDB local com o backup mais recente do Google Drive.
 * 
 * - Se houver um backup mais novo e de outro dispositivo, importa-o.
 * - Em seguida, exporta o IndexedDB local e envia para o Drive.
 */
export async function sincronizar() {
  if (rodando) return;
  rodando = true;

  try {
    // 1. Tenta baixar backup do Drive
    const arquivo = await baixarUltimoArquivo();

    const isDeOutroDispositivo = arquivo && !arquivo.nome.includes(DEVICE_ID);

    if (arquivo && isDeOutroDispositivo) {
      console.log('↙️ Sincronizando do Drive...', arquivo.nome);

      const dados = arquivo.dados;

      await db.transaction('rw', [
        db.reservas,
        db.checkins,
        db.consumos,
        db.precos,
        db.usuarios,
        db.despesas
      ], async () => {

        for (const [storeName, items] of Object.entries(dados)) {
          const table = (db as any)[storeName];
          if (table && Array.isArray(items)) {
            await table.clear();
            await Promise.all(items.map((item: any) => table.put(item)));
          }
        }
      });
    }

    // 2. Exporta dados do IndexedDB atual
    const exportObj: Record<string, any[]> = {};
    const stores = ['reservas', 'checkins', 'consumos', 'despesas', 'precos', 'usuarios'];

    for (const store of stores) {
      exportObj[store] = await (db as any)[store].toArray();
    }

    const nome = gerarNomeArquivo();
    console.log('↗️ Subindo backup para Drive...', nome);
    await uploadArquivoJson(nome, exportObj);

  } catch (erro) {
    console.error('❌ Erro ao sincronizar:', erro);
  } finally {
    rodando = false;
  }
}
