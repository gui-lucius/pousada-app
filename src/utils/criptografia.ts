import CryptoJS from 'crypto-js';

const CHAVE_SECRETA = 'pousada_vale_trutas_2025';

export function criptografar(texto: string): string {
  return CryptoJS.AES.encrypt(texto, CHAVE_SECRETA).toString();
}

export function descriptografar(textoCriptografado: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(textoCriptografado, CHAVE_SECRETA);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

export function criptografarObjeto<T extends object>(obj: T): T {
  const resultado: Record<string, unknown> = {};

  for (const chave in obj) {
    const valor = obj[chave as keyof T];
    resultado[chave] = typeof valor === 'string' ? criptografar(valor) : valor;
  }

  return resultado as T;
}

export function descriptografarObjeto<T extends object>(obj: T): T {
  const resultado: Record<string, unknown> = {};

  for (const chave in obj) {
    const valor = obj[chave as keyof T];
    resultado[chave] = typeof valor === 'string' ? descriptografar(valor) : valor;
  }

  return resultado as T;
}
