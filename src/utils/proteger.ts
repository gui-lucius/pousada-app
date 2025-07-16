import { estaLogado, isAdmin } from './auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function useProtegido() {
  const router = useRouter();

  useEffect(() => {
    if (!estaLogado()) {
      router.push('/login');
    }
  }, [router]);
}

export function useApenasAdmin() {
  const router = useRouter();

  useEffect(() => {
    if (!estaLogado() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);
}
