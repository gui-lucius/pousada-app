import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { iniciarMonitoramentoInatividade } from '@/utils/inatividade';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    iniciarMonitoramentoInatividade();
    // 🔄 A sincronização automática já está no db.ts e roda ao importar
  }, []);

  return <Component {...pageProps} />;
}
