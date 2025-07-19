import { db } from './db';
import {
  salvarArquivoNoDrive,
  buscarUltimoBackupNoDrive,
  baixarArquivoDoDrive
} from './googleDrive';

const CHAVE_BACKUP_TIMESTAMP = 'ultimoBackupRestaurado';

// Gera ou recupera o deviceId salvo no localStorage
const deviceId = localStorage.getItem('pousada_device_id') || (() => {
  const novoId = `device-${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('pousada_device_id', novoId);
  return novoId;
})();

// Módulos dinâmicos do Dexie
let exportDB: typeof import('dexie-export-import').exportDB;
let importInto: typeof import('dexie-export-import').importInto;

async function carregarDexieExport() {
  if (!exportDB || !importInto) {
    const mod = await import('dexie-export-import');
    exportDB = mod.exportDB;
    importInto = mod.importInto;
  }
}

// Faz o backup local para o Google Drive
export async function fazerBackupParaDrive() {
  await carregarDexieExport();

  const blob = await exportDB(db, { prettyJson: true });
  const timestamp = Date.now();
  const nomeArquivo = `backup-pousada-${timestamp}-${deviceId}.json`;

  await salvarArquivoNoDrive(blob, nomeArquivo);
  localStorage.setItem(CHAVE_BACKUP_TIMESTAMP, timestamp.toString());

  console.log('☁️ Backup enviado para o Google Drive:', nomeArquivo);
}

// Restaura o backup mais recente do Drive
export async function restaurarBackupDoDrive() {
  await carregarDexieExport();

  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo || !ultimo.name || !ultimo.id) {
    console.warn('⚠️ Backup inválido ou incompleto no Drive.');
    return;
  }

  const backupTimestamp = extrairTimestampDoNome(ultimo.name);
  const backupDeviceId = extrairDeviceId(ultimo.name);
  const ultimoRestaurado = Number(localStorage.getItem(CHAVE_BACKUP_TIMESTAMP) || 0);

  if (backupDeviceId === deviceId || backupTimestamp <= ultimoRestaurado) {
    console.log('🔄 Backup ignorado (antigo ou do mesmo dispositivo).');
    return;
  }

  const blob = await baixarArquivoDoDrive(ultimo.id);
  if (blob) {
    await importInto(db, blob);
    localStorage.setItem(CHAVE_BACKUP_TIMESTAMP, backupTimestamp.toString());
    console.log('✅ Backup restaurado do Google Drive:', ultimo.name);
  }
}

// Verifica se tem um novo backup no Drive e sincroniza
export async function verificarESincronizarBackup() {
  const ultimo = await buscarUltimoBackupNoDrive();
  if (!ultimo || !ultimo.name || !ultimo.id) return;

  const backupTimestamp = extrairTimestampDoNome(ultimo.name);
  const backupDeviceId = extrairDeviceId(ultimo.name);
  const ultimoRestaurado = Number(localStorage.getItem(CHAVE_BACKUP_TIMESTAMP) || 0);

  if (backupTimestamp > ultimoRestaurado && backupDeviceId !== deviceId) {
    console.log('🔔 Novo backup de outro dispositivo detectado. Restaurando...');
    await restaurarBackupDoDrive();
  }
}

// Inicia um sync automático a cada X minutos
export function iniciarSincronizacaoAutomatica(intervaloMinutos = 2) {
  verificarESincronizarBackup();
  setInterval(verificarESincronizarBackup, intervaloMinutos * 60 * 1000);
}

// Helpers
function extrairTimestampDoNome(nome: string): number {
  const regex = /backup-pousada-(\d+)-device.*\.json/;
  const match = nome.match(regex);
  return match ? Number(match[1]) : 0;
}

function extrairDeviceId(nome: string): string {
  const regex = /backup-pousada-\d+-(device.*)\.json/;
  const match = nome.match(regex);
  return match ? match[1] : '';
}
