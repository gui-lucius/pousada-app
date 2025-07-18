import { db } from './db';
import bcrypt from 'bcryptjs';

// Tipo principal com tudo (inclusive updatedAt)
export type Usuario = {
  nome: string;
  senha: string;
  permissao: 'super' | 'usuario';
  updatedAt: number;
};

// Tipo para armazenar no localStorage (sem senha e sem updatedAt)
type UsuarioSemSenha = Omit<Usuario, 'senha' | 'updatedAt'>;

const CHAVE_ATUAL = 'pousada_usuario_logado';

// Salva localmente sem senha e sem updatedAt
function salvarUsuarioLocal(usuario: Usuario) {
  const seguro: UsuarioSemSenha = {
    nome: usuario.nome,
    permissao: usuario.permissao,
  };
  localStorage.setItem(CHAVE_ATUAL, JSON.stringify(seguro));
}

// Carrega do localStorage
function carregarUsuarioLocal(): UsuarioSemSenha | null {
  try {
    const raw = localStorage.getItem(CHAVE_ATUAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Criação de usuário (define updatedAt automaticamente)
export async function criarUsuario(usuario: Omit<Usuario, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  if (!usuario.nome || !usuario.senha) return;

  const existente = await db.usuarios.get(usuario.nome);
  if (!existente) {
    const hash = await bcrypt.hash(usuario.senha, 10);
    await db.usuarios.add({
      ...usuario,
      senha: hash,
      updatedAt: Date.now(),
    });
  }
}

// Faz login e retorna os dados do usuário sem senha e updatedAt
export async function fazerLogin(nome: string, senhaDigitada: string): Promise<UsuarioSemSenha | null> {
  if (typeof window === 'undefined') return null;

  const usuario = await db.usuarios.get(nome);
  if (!usuario) return null;

  const senhaCorreta = await bcrypt.compare(senhaDigitada, usuario.senha);
  if (senhaCorreta) {
    salvarUsuarioLocal(usuario);
    return {
      nome: usuario.nome,
      permissao: usuario.permissao,
    };
  }

  return null;
}

// Verifica usuário atual (local)
export function usuarioAtual(): UsuarioSemSenha | null {
  if (typeof window === 'undefined') return null;
  return carregarUsuarioLocal();
}

// Verifica se é admin
export function isAdmin(): boolean {
  return usuarioAtual()?.permissao === 'super';
}

// Verifica se há login
export function estaLogado(): boolean {
  return !!usuarioAtual();
}

// Limpa localStorage
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ATUAL);
}
