let gapi: typeof import('gapi-script').gapi;

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_FOLDER_ID!;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;

async function carregarGapiScript() {
  if (!gapi) {
    const mod = await import('gapi-script');
    gapi = mod.gapi;
  }
}

export async function carregarApiGoogle(): Promise<void> {
  if (typeof window === 'undefined') throw new Error('gapi só pode ser carregado no navegador');
  if (gapiLoaded) return;

  await carregarGapiScript();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          });
          gapiLoaded = true;
          resolve();
        } catch (erro) {
          reject(erro);
        }
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export async function loginGoogle(): Promise<gapi.auth2.GoogleUser | null> {
  try {
    await carregarApiGoogle();
    const auth = gapi.auth2.getAuthInstance();
    const user = await auth.signIn();
    return user;
  } catch (erro) {
    console.error('Erro ao fazer login com Google:', erro);
    return null;
  }
}

export async function silentLoginGoogle(): Promise<gapi.auth2.GoogleUser | null> {
  try {
    await carregarApiGoogle();
    const auth = gapi.auth2.getAuthInstance();
    if (auth.isSignedIn.get()) {
      return auth.currentUser.get();
    }
    return await auth.signIn({ prompt: 'none' });
  } catch (erro) {
    console.warn('Login silencioso falhou:', erro);
    return null;
  }
}

export function logoutGoogle() {
  if (typeof window === 'undefined') return;
  const auth = gapi.auth2.getAuthInstance();
  if (auth) auth.signOut();
}

export function usuarioGoogleAtual(): gapi.auth2.GoogleUser | null {
  if (typeof window === 'undefined') return null;
  const auth = gapi.auth2.getAuthInstance();
  return auth?.isSignedIn.get() ? auth.currentUser.get() : null;
}

export function estaLogadoGoogle(): boolean {
  if (typeof window === 'undefined') return false;
  const auth = gapi.auth2.getAuthInstance();
  return auth?.isSignedIn.get() ?? false;
}

export async function salvarArquivoNoDrive(blob: Blob, nomeArquivo: string): Promise<string | null> {
  if (typeof window === 'undefined' || !gapi) return null;

  const metadata = {
    name: nomeArquivo,
    mimeType: 'application/json',
    parents: [FOLDER_ID],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const token = gapi.auth.getToken().access_token;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    body: form,
  });

  if (!res.ok) {
    console.error('Erro ao salvar no Drive:', await res.text());
    return null;
  }

  const data = await res.json();
  return data.id || null;
}

export async function buscarUltimoBackupNoDrive(): Promise<gapi.client.drive.File | null> {
  if (typeof window === 'undefined' || !gapi) return null;

  const res = await gapi.client.drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/json' and trashed = false`,
    orderBy: 'createdTime desc',
    pageSize: 1,
    fields: 'files(id, name, createdTime)',
  });

  const arquivos = res.result.files;
  return arquivos && arquivos.length > 0 ? arquivos[0] : null;
}

export async function baixarArquivoDoDrive(fileId: string): Promise<Blob | null> {
  if (typeof window === 'undefined' || !gapi) return null;

  const token = gapi.auth.getToken().access_token;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });

  if (!res.ok) {
    console.error('Erro ao baixar do Drive:', await res.text());
    return null;
  }

  return await res.blob();
}

export async function limparBackupsAntigos(): Promise<void> {
  if (typeof window === 'undefined' || !gapi) return;

  const res = await gapi.client.drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/json' and trashed = false`,
    fields: 'files(id, name, createdTime)',
  });

  const arquivos = res.result.files;
  if (arquivos && arquivos.length > 1) {
    for (let i = 1; i < arquivos.length; i++) {
      await gapi.client.drive.files.delete({ fileId: arquivos[i].id! });
    }
  }
}
