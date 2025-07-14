import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import Input from '@/components/ui/Input'
import Botao from '@/components/ui/Botao'
import { fazerLogin, criarUsuario } from '@/utils/auth'
import { db } from '@/utils/db'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const handleLogin = async () => {
    setErro('')

    const usuario = await fazerLogin(nome, senha)

    if (usuario) {
      router.push('/checkin')
    } else {
      setErro('Usuário ou senha inválidos!')
    }
  }

  const resetarUsuarios = async () => {
    if (!confirm('⚠️ Isso vai apagar todos os usuários e recriar o admin. Continuar?')) return

    await db.usuarios.clear()

    await criarUsuario({
      nome: 'admin',
      senha: '1234',
      permissao: 'super'
    })

    alert('✅ Usuário admin recriado com sucesso!\n\nUse:\nUsuário: admin\nSenha: 1234')
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
            onChange={e => setNome(e.target.value)}
            className="text-black text-lg py-3"
          />
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="text-black text-lg py-3"
          />

          {erro && <p className="text-red-600 text-base">{erro}</p>}

          <div className="w-full flex flex-col items-center gap-2">
            <Botao texto="Entrar" onClick={handleLogin} />
            <button
              onClick={resetarUsuarios}
              className="text-sm text-blue-600 underline"
            >
              Resetar usuários (dev)
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
