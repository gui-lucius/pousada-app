import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Tipo principal do usuário
export type Usuario = {
  id: string; // agora é id do Prisma (UUID)
  nome: string;
  senha: string;
  permissao: 'super' | 'usuario';
  updatedAt: Date;
};

// Versão segura para o localStorage (sem senha)
type UsuarioSemSenha = Omit<Usuario, 'senha' | 'updatedAt' | 'id'>;

const CHAVE_ATUAL = 'pousada_usuario_logado';

// 🔐 Salva no localStorage sem dados sensíveis
function salvarUsuarioLocal(usuario: Usuario) {
  const seguro: UsuarioSemSenha = {
    nome: usuario.nome,
    permissao: usuario.permissao,
  };
  localStorage.setItem(CHAVE_ATUAL, JSON.stringify(seguro));
}

// 🔐 Recupera usuário do localStorage
function carregarUsuarioLocal(): UsuarioSemSenha | null {
  try {
    const raw = localStorage.getItem(CHAVE_ATUAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 👤 Cria um novo usuário (caso não exista)
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
    // continue para criar usuário
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

  // Cast explícito para permissao
  const novoUsuario = {
    ...novoUsuarioRaw,
    permissao: (novoUsuarioRaw.permissao === 'super' ? 'super' : 'usuario') as 'super' | 'usuario',
  };

  salvarUsuarioLocal(novoUsuario as Usuario);
}

// 🔑 Faz login e salva o usuário localmente (sem senha)
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

// 👁️ Retorna o usuário atual logado (sem senha)
export function usuarioAtual(): UsuarioSemSenha | null {
  if (typeof window === 'undefined') return null;
  return carregarUsuarioLocal();
}

// 🛡️ Verifica se é administrador
export function isAdmin(): boolean {
  return usuarioAtual()?.permissao === 'super';
}

// ✅ Verifica se há login
export function estaLogado(): boolean {
  return !!usuarioAtual();
}

// 🚪 Faz logout do sistema
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ATUAL);
}
