import { useEffect } from 'react';
import { sincronizar } from './sync';

export function useSyncAutomatico(intervaloMs = 60_000) {
  useEffect(() => {
    sincronizar(); 
    const id = setInterval(() => sincronizar(), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
}
