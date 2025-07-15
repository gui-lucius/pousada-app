'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { estaLogado, usuarioAtual, logout } from '@/utils/auth';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  semPadding?: boolean;
}

export default function Layout({ children, title = 'Pousada App', semPadding }: LayoutProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [user, setUser] = useState<{ nome: string; permissao: string } | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMostrarMenu(estaLogado() && router.pathname !== '/login');
    setUser(usuarioAtual());
  }, [router.pathname]);

  useEffect(() => {
    const fecharMenu = (e: MouseEvent) => {
      if (menuAberto && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', fecharMenu);
    return () => document.removeEventListener('mousedown', fecharMenu);
  }, [menuAberto]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen flex bg-gray-100 text-zinc-800 overflow-hidden relative font-sans">
      {mostrarMenu && (
        <aside
          ref={menuRef}
          className={`text-white w-[220px] p-6 space-y-5 fixed top-0 bottom-0 z-40 transition-transform duration-300
            ${menuAberto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          style={{
            background: 'linear-gradient(to bottom, #6d4c41, #4e342e)',
          }}
          aria-label="Menu lateral"
        >
          <h2 className="text-xl font-bold mb-6 tracking-tight drop-shadow">Pousada App</h2>

          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/checkin" className="hover:underline">Check-In</Link>
            <Link href="/checkout" className="hover:underline">Check-Out</Link>
            <Link href="/reservas" className="hover:underline">Reservas</Link>
            <Link href="/consumo" className="hover:underline">Comandas</Link>
            <Link href="/calendario" className="hover:underline">Calendário</Link>

            {user?.permissao === 'super' && (
              <>
                <Link href="/faturamento" className="hover:underline">Faturamento</Link>
                <Link href="/lucro" className="hover:underline">Lucro</Link>
                <Link href="/precos" className="hover:underline">Preços</Link>
                <Link href="/despesas" className="hover:underline">Despesas</Link>
                <Link href="/admin" className="hover:underline">Gestão de Usuários</Link>
              </>
            )}
          </nav>

          <div className="absolute bottom-6 left-6 text-xs leading-tight">
            <p className="mb-1 font-medium">{user?.nome}</p>
            <button
              onClick={handleLogout}
              className="underline text-white hover:text-gray-200 transition"
            >
              Sair
            </button>
          </div>
        </aside>
      )}

      <div className={`${mostrarMenu ? 'lg:ml-[220px]' : ''} flex flex-col w-full h-screen transition-all duration-300`}>
        {mostrarMenu && (
          <header className="text-white px-4 py-3 shadow-md flex items-center gap-4"
          style={{
          background: 'linear-gradient(to right, #4e8098, #6ca0b8, #89bfd7)',
        }}>
            <button
              className="lg:hidden p-2 bg-[#5d4037] text-white rounded-md"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold tracking-wide">{title}</h1>
          </header>
        )}

        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            semPadding ? '' : 'p-6'
          } bg-white/80 backdrop-blur-lg rounded-tl-2xl`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
