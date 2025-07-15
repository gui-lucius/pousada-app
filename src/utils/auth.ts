import { db } from './db'
import bcrypt from 'bcryptjs'

export type Usuario = {
  nome: string
  senha: string // agora é o hash
  permissao: 'super' | 'usuario'
}

const CHAVE_ATUAL = 'pousada_usuario_logado'

// 🔒 Nunca salva a senha no localStorage
function salvarUsuarioLocal(usuario: Usuario) {
  const { senha: _senha, ...seguro } = usuario
  localStorage.setItem(CHAVE_ATUAL, JSON.stringify(seguro))
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

// ✅ Criação com senha criptografada
export async function criarUsuario(usuario: Usuario) {
  if (typeof window === 'undefined') return
  if (!usuario.nome || !usuario.senha) return

  const existente = await db.usuarios.get(usuario.nome)
  if (!existente) {
    const hash = await bcrypt.hash(usuario.senha, 10)
    await db.usuarios.add({
      ...usuario,
      senha: hash
    })
  }
}

// ✅ Login com comparação do hash
export async function fazerLogin(nome: string, senhaDigitada: string): Promise<Usuario | null> {
  if (typeof window === 'undefined') return null

  const usuario = await db.usuarios.get(nome)
  if (!usuario) return null

  const senhaCorreta = await bcrypt.compare(senhaDigitada, usuario.senha)
  if (senhaCorreta) {
    salvarUsuarioLocal(usuario)
    return usuario
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
