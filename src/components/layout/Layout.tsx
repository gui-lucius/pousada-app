'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { estaLogado, usuarioAtual, logout } from '@/utils/auth'

interface LayoutProps {
  children: ReactNode
  title?: string
  semPadding?: boolean
}

export default function Layout({ children, title, semPadding }: LayoutProps) {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [user, setUser] = useState<{ nome: string; permissao: string } | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMostrarMenu(estaLogado() && router.pathname !== '/login')
      setUser(usuarioAtual())
    }
  }, [router.pathname])

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (menuAberto && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [menuAberto])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="h-screen bg-[#f7f8f8] flex overflow-hidden relative">
      {mostrarMenu && (
        <aside
          ref={menuRef}
          className={`bg-[#754b42] text-white w-[200px] p-4 space-y-4 fixed top-0 bottom-0 z-40 transition-transform duration-300
          ${menuAberto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          <h2 className="font-bold text-lg">Pousada App</h2>
          <nav className="space-y-2">
            <a href="/checkin" className="block">Check-In</a>
            <a href="/checkout" className="block">Check-Out</a>
            <a href="/reservas" className="block">Reservas</a>
            <a href="/consumo" className="block">Comandas</a>
            <a href="/calendario" className="block">Calendário</a>

            {user?.permissao === 'super' && (
              <>
                <a href="/faturamento" className="block">Faturamento</a>
                <a href="/precos" className="block">Preços</a>
                <a href="/admin" className="block">Gestão de Usuários</a>
              </>
            )}
          </nav>
          <div className="absolute bottom-4 left-4">
            <p className="text-xs">{user?.nome}</p>
            <button onClick={handleLogout} className="text-sm underline">Sair</button>
          </div>
        </aside>
      )}

      <div className={`${mostrarMenu ? 'lg:ml-[200px]' : ''} flex flex-col w-full h-screen transition-all duration-300`}>
        {mostrarMenu && (
          <header className="bg-[#568db3] text-white px-4 py-3 shadow-md flex items-center gap-4">
            {!menuAberto && (
              <button
                className="lg:hidden p-2 bg-[#754b42] text-white rounded-md"
                onClick={() => setMenuAberto(true)}
              >
                ☰
              </button>
            )}
            <h1 className="text-lg font-semibold">{title || 'Pousada App'}</h1>
          </header>
        )}

        <main className={`flex-1 ${semPadding ? '' : 'p-4'} overflow-y-auto`}>
          {children}
        </main>
      </div>
    </div>
  )
}
