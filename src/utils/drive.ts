import { carregarApiGoogle, estaLogadoGoogle, loginGoogle } from './googleDrive';
import { salvarArquivoNoDrive, buscarUltimoBackupNoDrive, baixarArquivoDoDrive } from './googleDrive';

const MIME_JSON = 'application/json';

/**
 * Garante que o usuário está autenticado com o Google.
 */
async function garantirLogin() {
  if (!estaLogadoGoogle()) {
    await loginGoogle();
  }
}

/**
 * Envia um arquivo JSON para o Google Drive com o nome especificado.
 */
export async function uploadArquivoJson(nome: string, dados: any): Promise<string | null> {
  await garantirLogin();

  const blob = new Blob([JSON.stringify(dados)], { type: MIME_JSON });
  return await salvarArquivoNoDrive(blob, nome);
}

/**
 * Lista o último backup encontrado no Google Drive.
 */
export async function listarArquivos(): Promise<gapi.client.drive.File[]> {
  await garantirLogin();

  const arquivo = await buscarUltimoBackupNoDrive();
  return arquivo ? [arquivo] : [];
}

/**
 * Baixa e retorna o conteúdo do último backup em formato { nome, dados }.
 */
export async function baixarUltimoArquivo(): Promise<{ nome: string; dados: any } | null> {
  await garantirLogin();

  const item = await buscarUltimoBackupNoDrive();
  if (!item?.id || !item?.name) return null;

  const blob = await baixarArquivoDoDrive(item.id);
  if (!blob) return null;

  const text = await blob.text();
  return { nome: item.name, dados: JSON.parse(text) };
}
