import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export type Usuario = {
  id: string;
  nome: string;
  senha: string;
  permissao: 'super' | 'usuario';
  updatedAt: Date;
};

type UsuarioSemSenha = Omit<Usuario, 'senha' | 'updatedAt' | 'id'>;

const CHAVE_ATUAL = 'pousada_usuario_logado';

function salvarUsuarioLocal(usuario: Usuario) {
  const seguro: UsuarioSemSenha = {
    nome: usuario.nome,
    permissao: usuario.permissao,
  };
  localStorage.setItem(CHAVE_ATUAL, JSON.stringify(seguro));
}

function carregarUsuarioLocal(): UsuarioSemSenha | null {
  try {
    const raw = localStorage.getItem(CHAVE_ATUAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function criarUsuario(usuario: Omit<Usuario, 'updatedAt' | 'id'>) {
  if (typeof window === 'undefined') return;
  if (!usuario.nome || !usuario.senha) return;

  try {
    const existente = await prisma.usuario.findUnique({
      where: { nome: usuario.nome },
    });
    if (existente) {
      console.warn('Usuário já existe.');
      return;
    }
  } catch {
  }

  const hash = await bcrypt.hash(usuario.senha, 10);
  const novoUsuarioRaw = await prisma.usuario.create({
    data: {
      nome: usuario.nome,
      senha: hash,
      permissao: usuario.permissao,
      updatedAt: new Date(),
    },
  });

  const novoUsuario = {
    ...novoUsuarioRaw,
    permissao: (novoUsuarioRaw.permissao === 'super' ? 'super' : 'usuario') as 'super' | 'usuario',
  };

  salvarUsuarioLocal(novoUsuario as Usuario);
}

export async function fazerLogin(
  nome: string,
  senhaDigitada: string
): Promise<UsuarioSemSenha | null> {
  if (typeof window === 'undefined') return null;

  try {
    const usuarioRaw = await prisma.usuario.findUnique({
      where: { nome },
    });
    if (!usuarioRaw) return null;

    const usuario = {
      ...usuarioRaw,
      permissao: (usuarioRaw.permissao === 'super' ? 'super' : 'usuario') as 'super' | 'usuario',
    };

    const senhaCorreta = await bcrypt.compare(senhaDigitada, usuario.senha);
    if (senhaCorreta) {
      salvarUsuarioLocal(usuario as Usuario);
      return {
        nome: usuario.nome,
        permissao: usuario.permissao,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function usuarioAtual(): UsuarioSemSenha | null {
  if (typeof window === 'undefined') return null;
  return carregarUsuarioLocal();
}

export function isAdmin(): boolean {
  return usuarioAtual()?.permissao === 'super';
}

export function estaLogado(): boolean {
  return !!usuarioAtual();
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ATUAL);
}
