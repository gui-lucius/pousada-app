import { db } from './db'

export type Usuario = {
  nome: string
  senha: string
  permissao: 'super' | 'usuario'
}

const CHAVE_ATUAL = 'pousada_usuario_logado'

function salvarUsuarioLocal(usuario: Usuario) {
  localStorage.setItem(CHAVE_ATUAL, JSON.stringify(usuario))
}

function carregarUsuarioLocal(): Usuario | null {
  try {
    const raw = localStorage.getItem(CHAVE_ATUAL)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function criarUsuario(usuario: Usuario) {
  if (typeof window === 'undefined') return

  if (!usuario.nome || !usuario.senha) return

  const existente = await db.usuarios.get(usuario.nome)
  if (!existente) {
    await db.usuarios.add(usuario)
  }
}

export async function fazerLogin(nome: string, senha: string): Promise<Usuario | null> {
  if (typeof window === 'undefined') return null

  const usuarios = await db.usuarios.toArray()

  if (usuarios.length === 0) {
    const adminPadrao: Usuario = { nome: 'admin', senha: '1234', permissao: 'super' }
    await db.usuarios.add(adminPadrao)
    salvarUsuarioLocal(adminPadrao)
    return adminPadrao
  }

  const user = usuarios.find(u => u.nome === nome && u.senha === senha)
  if (user) {
    salvarUsuarioLocal(user)
    return user
  }

  return null
}

export function usuarioAtual(): Usuario | null {
  if (typeof window === 'undefined') return null
  return carregarUsuarioLocal()
}

export function isAdmin(): boolean {
  return usuarioAtual()?.permissao === 'super'
}

export function estaLogado(): boolean {
  return !!usuarioAtual()
}

export function logout() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAVE_ATUAL)
}
