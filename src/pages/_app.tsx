import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { iniciarMonitoramentoInatividade } from '@/utils/inatividade';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    iniciarMonitoramentoInatividade();
  }, []);

  return <Component {...pageProps} />;
}
