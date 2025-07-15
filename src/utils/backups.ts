import { db } from './db';
import {
  salvarArquivoNoDrive,
  buscarUltimoBackupNoDrive,
  baixarArquivoDoDrive
} from './googleDrive';

const CHAVE_BACKUP_TIMESTAMP = 'ultimoBackupRestaurado';

// Variáveis para guardar os métodos após importação dinâmica
let exportDB: typeof import('dexie-export-import').exportDB;
let importInto: typeof import('dexie-export-import').importInto;

/** Importa dinamicamente o módulo dexie-export-import no lado cliente */
async function carregarDexieExport() {
  if (!exportDB || !importInto) {
    const mod = await import('dexie-export-import');
    exportDB = mod.exportDB;
    importInto = mod.importInto;
  }
}

/** Gera o backup atual e envia para o Google Drive */
export async function fazerBackupParaDrive() {
  await carregarDexieExport(); // ✅ importa apenas no cliente

  const blob = await exportDB(db, { prettyJson: true });
  const timestamp = Date.now();
  const nomeArquivo = `backup-pousada-${timestamp}.json`;

  await salvarArquivoNoDrive(blob, nomeArquivo);
  localStorage.setItem(CHAVE_BACKUP_TIMESTAMP, timestamp.toString());

  console.log('☁️ Backup enviado para o Google Drive:', nomeArquivo);
}

/** Restaura os dados do backup mais recente do Google Drive */
export async function restaurarBackupDoDrive() {
  await carregarDexieExport(); // ✅ importa apenas no cliente

  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo) return console.warn('Nenhum backup encontrado no Drive.');

  const backupTimestamp = extrairTimestampDoNome(ultimo.name);
  const ultimoRestaurado = Number(localStorage.getItem(CHAVE_BACKUP_TIMESTAMP) || 0);

  if (backupTimestamp <= ultimoRestaurado) {
    console.log('🔄 Backup do Drive é antigo ou igual. Ignorando restauração.');
    return;
  }

  const blob = await baixarArquivoDoDrive(ultimo.id);
  if (blob) {
    await importInto(db, blob);
    localStorage.setItem(CHAVE_BACKUP_TIMESTAMP, backupTimestamp.toString());
    console.log('✅ Backup restaurado do Google Drive:', ultimo.name);
  }
}

/** Verifica se há backup mais novo e sincroniza */
export async function verificarESincronizarBackup() {
  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo) return;

  const backupTimestamp = extrairTimestampDoNome(ultimo.name);
  const ultimoRestaurado = Number(localStorage.getItem(CHAVE_BACKUP_TIMESTAMP) || 0);

  if (backupTimestamp > ultimoRestaurado) {
    console.log('🔔 Novo backup encontrado no Drive. Restaurando...');
    await restaurarBackupDoDrive();
  }
}

/** Inicia a verificação automática a cada X minutos */
export function iniciarSincronizacaoAutomatica(intervaloMinutos = 2) {
  verificarESincronizarBackup(); // executa no início
  setInterval(verificarESincronizarBackup, intervaloMinutos * 60 * 1000);
}

/** Extrai o timestamp do nome do arquivo */
function extrairTimestampDoNome(nome: string): number {
  const regex = /backup-pousada-(\d+)\.json/;
  const match = nome.match(regex);
  return match ? Number(match[1]) : 0;
}
