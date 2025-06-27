import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Botao from '@/components/ui/Botao';
import { useState, useEffect } from 'react';
import { criarUsuario, usuarioAtual } from '@/utils/auth';
import { useApenasAdmin } from '@/utils/proteger';

type Usuario = {
  nome: string;
  senha: string;
  permissao: 'usuario' | 'super';
};

const CHAVE_USUARIOS = 'pousada_usuarios';

export default function AdminPage() {
  useApenasAdmin();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<Usuario>({ nome: '', senha: '', permissao: 'usuario' });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  const carregarUsuarios = () => {
    const lista = JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || '[]');
    setUsuarios(lista);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleSalvar = () => {
    const novos = [...usuarios];

    if (editando !== null) {
      novos[editando] = form;
    } else {
      novos.push(form);
    }

    localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(novos));
    setForm({ nome: '', senha: '', permissao: 'usuario' });
    setEditando(null);
    setMostrandoFormulario(false);
    carregarUsuarios();
  };

  const handleEditar = (index: number) => {
    setForm(usuarios[index]);
    setEditando(index);
    setMostrandoFormulario(true);
  };

  const handleExcluir = (index: number) => {
    const userAtual = usuarioAtual();
    const excluido = usuarios[index];

    if (userAtual?.nome === excluido.nome) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir "${excluido.nome}"?`)) {
      const novos = usuarios.filter((_, i) => i !== index);
      localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(novos));
      carregarUsuarios();
    }
  };

  return (
    <Layout title="Administração">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">Usuários Cadastrados</h2>
          <Botao texto="Novo Usuário" onClick={() => {
            setEditando(null);
            setForm({ nome: '', senha: '', permissao: 'usuario' });
            setMostrandoFormulario(true);
          }} />
        </div>

        <div className="border rounded p-4 bg-white shadow">
          {usuarios.length === 0 ? (
            <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm text-black">
              <thead>
                <tr>
                  <th className="py-2">Nome</th>
                  <th>Permissão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{u.nome}</td>
                    <td>{u.permissao === 'super' ? 'Super-Usuário' : 'Funcionário'}</td>
                    <td className="space-x-2">
                      <button onClick={() => handleEditar(i)} className="text-blue-600 underline">Editar</button>
                      <button onClick={() => handleExcluir(i)} className="text-red-600 underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {mostrandoFormulario && (
          <div className="border rounded p-4 bg-white shadow space-y-4">
            <Input
              label="Nome"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              label="Senha"
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Permissão</label>
              <select
                value={form.permissao}
                onChange={e => setForm({ ...form, permissao: e.target.value as Usuario['permissao'] })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="usuario">Funcionário</option>
                <option value="super">Super-Usuário</option>
              </select>
            </div>
            <Botao texto={editando !== null ? 'Salvar Alterações' : 'Criar Usuário'} onClick={handleSalvar} />
          </div>
        )}
      </div>
    </Layout>
  );
}
