import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { iniciarMonitoramentoInatividade } from '@/utils/inatividade';
import { iniciarSincronizacaoAutomatica } from '@/utils/backups';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    iniciarMonitoramentoInatividade();
    iniciarSincronizacaoAutomatica(2); 
  }, []);

  return <Component {...pageProps} />;
}
