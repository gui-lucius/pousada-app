import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setErro('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, senha }),
      })
      const data = await res.json()
      if (res.ok && data.usuario) {
        localStorage.setItem('pousada_usuario_logado', JSON.stringify(data.usuario))
        router.push('/reservas')
      } else {
        setErro(data.error || 'Usuário ou senha inválidos!')
      }
    } catch {
      setErro('Erro ao conectar ao servidor.')
    }
    setLoading(false)
  }

  return (
    <Layout semPadding>
      <div className="h-screen flex flex-col justify-between items-center bg-[#f7f8f8] px-6 py-8">
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-md gap-6">
          <Image
            src="/logo_pousada.png"
            alt="Logo da Pousada"
            width={260}
            height={140}
            className="mb-4"
          />

          <Input
            label="Usuário"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="text-black text-lg py-3"
          />
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="text-black text-lg py-3"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          {erro && <p className="text-red-600 text-base">{erro}</p>}

          <div className="w-full flex flex-col items-center gap-2">
            <Botao texto={loading ? "Entrando..." : "Entrar"} onClick={handleLogin} disabled={loading} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
