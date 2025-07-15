import CryptoJS from 'crypto-js';

const CHAVE_SECRETA = 'pousada_vale_trutas_2025';

/**
 * Criptografa um texto simples
 */
export function criptografar(texto: string): string {
  return CryptoJS.AES.encrypt(texto, CHAVE_SECRETA).toString();
}

/**
 * Descriptografa um texto
 */
export function descriptografar(textoCriptografado: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(textoCriptografado, CHAVE_SECRETA);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('Erro ao descriptografar:', e);
    return '';
  }
}

/**
 * Criptografa todos os campos string de um objeto
 */
export function criptografarObjeto<T extends object>(obj: T): T {
  const resultado = {} as T;

  for (const chave in obj) {
    const valor = obj[chave as keyof T];
    (resultado as any)[chave] = typeof valor === 'string' ? criptografar(valor) : valor;
  }

  return resultado;
}

/**
 * Descriptografa todos os campos string de um objeto
 */
export function descriptografarObjeto<T extends object>(obj: T): T {
  const resultado = {} as T;

  for (const chave in obj) {
    const valor = obj[chave as keyof T];
    (resultado as any)[chave] = typeof valor === 'string' ? descriptografar(valor) : valor;
  }

  return resultado;
}
