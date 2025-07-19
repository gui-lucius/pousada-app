import { db } from './db';
import { uploadArquivoJson, baixarUltimoArquivo } from './drive';

let rodando = false;

const DEVICE_ID =
  localStorage.getItem('pousada_device_id') ||
  (() => {
    const novo = `device-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('pousada_device_id', novo);
    return novo;
  })();

function gerarNomeArquivo(): string {
  return `backup-pousada-${Date.now()}-${DEVICE_ID}.json`;
}

export async function sincronizar() {
  if (rodando) return;
  rodando = true;

  try {
    const arquivo = await baixarUltimoArquivo();
    const isDeOutroDispositivo = arquivo && !arquivo.nome.includes(DEVICE_ID);

    if (arquivo && isDeOutroDispositivo) {
      console.log('↙️ Sincronizando do Drive...', arquivo.nome);

      const dados = arquivo.dados as Record<string, unknown[]>;

      await db.transaction(
        'rw',
        [db.reservas, db.checkins, db.consumos, db.precos, db.usuarios, db.despesas],
        async () => {
          for (const [storeName, items] of Object.entries(dados)) {
            const table = (db as Record<string, any>)[storeName];
            if (table && Array.isArray(items)) {
              await table.clear();
              await Promise.all(
                (items as Record<string, unknown>[]).map((item) => table.put(item))
              );
            }
          }
        }
      );
    }

    const exportObj: Record<string, unknown[]> = {};
    const stores = ['reservas', 'checkins', 'consumos', 'despesas', 'precos', 'usuarios'];

    for (const store of stores) {
      exportObj[store] = await (db as Record<string, any>)[store].toArray();
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
