import { logout } from './auth';

const LIMITE_MINUTOS = 10; // ⏱ Tempo limite de inatividade
const CHAVE_STORAGE = 'lastActiveAt';

let intervaloMonitoramento: ReturnType<typeof setInterval> | null = null;

export function registrarAtividade() {
  localStorage.setItem(CHAVE_STORAGE, Date.now().toString());
}

export function iniciarMonitoramentoInatividade() {
  if (typeof window === 'undefined') return;

  // Eventos que "renovam" a atividade
  ['click', 'mousemove', 'keydown'].forEach(evento =>
    window.addEventListener(evento, registrarAtividade)
  );

  registrarAtividade(); // Marca o tempo de entrada

  intervaloMonitoramento = setInterval(() => {
    const ultimo = localStorage.getItem(CHAVE_STORAGE);
    if (!ultimo) return;

    const minutosInativos = (Date.now() - Number(ultimo)) / 1000 / 60;

    if (minutosInativos >= LIMITE_MINUTOS) {
      console.warn('🔒 Inatividade detectada. Realizando logout...');
      pararMonitoramentoInatividade();
      logout();
      window.location.href = '/login';
    }
  }, 60 * 1000); // Verifica a cada 1 minuto
}

export function pararMonitoramentoInatividade() {
  if (intervaloMonitoramento) clearInterval(intervaloMonitoramento);

  ['click', 'mousemove', 'keydown'].forEach(evento =>
    window.removeEventListener(evento, registrarAtividade)
  );
}
