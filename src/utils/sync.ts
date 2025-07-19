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

type StoreName = 'reservas' | 'checkins' | 'consumos' | 'despesas' | 'precos' | 'usuarios';
type StoreData = {
  reservas: any[]; // substitua por `Reserva[]` se tiver o tipo
  checkins: any[];
  consumos: any[];
  despesas: any[];
  precos: any[];
  usuarios: any[];
};

export async function sincronizar() {
  if (rodando) return;
  rodando = true;

  try {
    const arquivo = await baixarUltimoArquivo();
    const isDeOutroDispositivo = arquivo && !arquivo.nome.includes(DEVICE_ID);

    if (arquivo && isDeOutroDispositivo) {
      console.log('↙️ Sincronizando do Drive...', arquivo.nome);

      const dados = arquivo.dados as Partial<StoreData>;

      await db.transaction(
        'rw',
        [db.reservas, db.checkins, db.consumos, db.precos, db.usuarios, db.despesas],
        async () => {
          for (const storeName of Object.keys(dados) as StoreName[]) {
            const items = dados[storeName];
            const table = db[storeName];
            if (table && Array.isArray(items)) {
              await table.clear();
              await Promise.all(
                items.map((item) => table.put(item)) // aqui item é `any`
              );
            }
          }
        }
      );
    }

    const exportObj: StoreData = {
      reservas: await db.reservas.toArray(),
      checkins: await db.checkins.toArray(),
      consumos: await db.consumos.toArray(),
      despesas: await db.despesas.toArray(),
      precos: await db.precos.toArray(),
      usuarios: await db.usuarios.toArray(),
    };

    const nome = gerarNomeArquivo();
    console.log('↗️ Subindo backup para Drive...', nome);
    await uploadArquivoJson(nome, exportObj);
  } catch (erro) {
    console.error('❌ Erro ao sincronizar:', erro);
  } finally {
    rodando = false;
  }
}
