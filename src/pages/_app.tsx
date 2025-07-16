import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { iniciarMonitoramentoInatividade } from '@/utils/inatividade';
import { iniciarSincronizacaoAutomatica } from '@/utils/backups';
import { silentLoginGoogle, estaLogadoGoogle } from '@/utils/googleDrive';

export default function App({ Component, pageProps }: AppProps) {
  const [googlePronto, setGooglePronto] = useState(false);

  useEffect(() => {
    async function inicializarApp() {
      const usuario = await silentLoginGoogle();
      if (usuario) {
        console.log('Login Google silencioso OK:', usuario.getBasicProfile().getEmail());
      } else {
        console.warn('Login silencioso falhou. Usuário precisará logar manualmente se necessário.');
      }

      iniciarMonitoramentoInatividade();
      iniciarSincronizacaoAutomatica(1);
      setGooglePronto(true);
    }

    inicializarApp();
  }, []);

  if (!googlePronto) {
    return <div style={{ padding: '2rem' }}>Carregando aplicação...</div>;
  }

  return <Component {...pageProps} />;
}
