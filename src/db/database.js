import Dexie from 'dexie';

export const db = new Dexie('PousadaDB');

db.version(1).stores({
  hospedes: '++id, nome, chale, checkin, checkout',
  consumos: '++id, hospedeId, item, preco, data',
  reservas: '++id, nome, dataEntrada, dataSaida, status',
  caixa: '++id, tipo, valor, data'
});
