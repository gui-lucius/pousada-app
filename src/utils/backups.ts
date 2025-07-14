import { db } from './db';
import {
  salvarArquivoNoDrive,
  buscarUltimoBackupNoDrive,
  baixarArquivoDoDrive
} from './googleDrive';

const CHAVE_BACKUP_TIMESTAMP = 'ultimoBackupRestaurado';

let exportDB: typeof import('dexie-export-import').exportDB;
let importInto: typeof import('dexie-export-import').importInto;

async function carregarDexieExport() {
  if (!exportDB || !importInto) {
    const mod = await import('dexie-export-import');
    exportDB = mod.exportDB;
    importInto = mod.importInto;
  }
}

export async function fazerBackupParaDrive() {
  await carregarDexieExport();

  const blob = await exportDB(db, { prettyJson: true });
  const timestamp = Date.now();
  const nomeArquivo = `backup-pousada-${timestamp}.json`;

  await salvarArquivoNoDrive(blob, nomeArquivo);
  localStorage.setItem(CHAVE_BACKUP_TIMESTAMP, timestamp.toString());

  console.log('☁️ Backup enviado para o Google Drive:', nomeArquivo);
}

export async function restaurarBackupDoDrive() {
  await carregarDexieExport();

  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo || !ultimo.name || !ultimo.id) {
    console.warn('⚠️ Backup inválido ou incompleto no Drive.');
    return;
  }

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

export async function verificarESincronizarBackup() {
  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo || !ultimo.name || !ultimo.id) return;

  const backupTimestamp = extrairTimestampDoNome(ultimo.name);
  const ultimoRestaurado = Number(localStorage.getItem(CHAVE_BACKUP_TIMESTAMP) || 0);

  if (backupTimestamp > ultimoRestaurado) {
    console.log('🔔 Novo backup encontrado no Drive. Restaurando...');
    await restaurarBackupDoDrive();
  }
}

export function iniciarSincronizacaoAutomatica(intervaloMinutos = 2) {
  verificarESincronizarBackup();
  setInterval(verificarESincronizarBackup, intervaloMinutos * 60 * 1000);
}

function extrairTimestampDoNome(nome: string): number {
  const regex = /backup-pousada-(\d+)\.json/;
  const match = nome.match(regex);
  return match ? Number(match[1]) : 0;
}
