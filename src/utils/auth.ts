type Usuario = {
  nome: string;
  senha: string;
  permissao: 'super' | 'usuario';
};

const CHAVE_USUARIOS = 'pousada_usuarios';
const CHAVE_ATUAL = 'pousada_usuario_logado';

export function criarUsuario(usuario: Usuario) {
  if (typeof window === 'undefined') return;

  const usuarios: Usuario[] = JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || '[]');
  usuarios.push(usuario);
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
}

export function fazerLogin(nome: string, senha: string): Usuario | null {
  if (typeof window === 'undefined') return null;

  let usuarios: Usuario[] = JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || '[]');

  if (usuarios.length === 0) {
    const adminPadrao: Usuario = { nome: 'admin', senha: '1234', permissao: 'super' };
    usuarios = [adminPadrao];
    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios));
  }

  const user = usuarios.find(u => u.nome === nome && u.senha === senha);
  if (user) {
    localStorage.setItem(CHAVE_ATUAL, JSON.stringify(user));
    return user;
  }

  return null;
}

export function usuarioAtual(): Usuario | null {
  if (typeof window === 'undefined') return null;

  const user = localStorage.getItem(CHAVE_ATUAL);
  return user ? JSON.parse(user) : null;
}

export function isAdmin(): boolean {
  const user = usuarioAtual();
  return user?.permissao === 'super';
}

export function estaLogado(): boolean {
  return !!usuarioAtual();
}

export function logout() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CHAVE_ATUAL);
}
