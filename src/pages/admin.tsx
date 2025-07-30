'use client';

import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Botao from '@/components/ui/Botao';
import { useState, useEffect } from 'react';
import { useApenasAdmin } from '@/utils/proteger';
import { usuarioAtual } from '@/utils/auth';

type Usuario = {
  id: string;
  nome: string;
  permissao: 'usuario' | 'super';
  updatedAt: string;
};

export default function AdminPage() {
  useApenasAdmin();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', senha: '', permissao: 'usuario' as 'usuario' | 'super' });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    const res = await fetch('/api/usuario');
    const data = await res.json();
    setUsuarios(data);
  };

  const resetarFormulario = () => {
    setForm({ nome: '', senha: '', permissao: 'usuario' });
    setEditando(null);
    setMostrandoFormulario(false);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.senha.trim()) {
      alert('Preencha todos os campos.');
      return;
    }

    if (editando) {
      // Editar usuário
      const res = await fetch(`/api/usuario`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando,
          nome: form.nome,
          senha: form.senha,
          permissao: form.permissao,
        }),
      });
      if (!res.ok) {
        alert('Erro ao editar usuário');
        return;
      }
    } else {
      // Novo usuário
      const res = await fetch('/api/usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        alert('Erro ao criar usuário');
        return;
      }
    }

    resetarFormulario();
    carregarUsuarios();
  };

  const handleEditar = (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    setForm({ nome: usuario.nome, senha: '', permissao: usuario.permissao });
    setEditando(id);
    setMostrandoFormulario(true);
  };

  const handleExcluir = async (id: string) => {
    const atual = usuarioAtual();
    const alvo = usuarios.find(u => u.id === id);
    if (!alvo) return;

    if (atual?.nome === alvo.nome) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }

    const confirmar = confirm(`Tem certeza que deseja excluir "${alvo.nome}"?`);
    if (!confirmar) return;

    const res = await fetch('/api/usuario', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      alert('Erro ao excluir usuário');
      return;
    }
    carregarUsuarios();
  };

  return (
    <Layout title="Administração">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">Usuários Cadastrados</h2>
          <Botao
            texto="Novo Usuário"
            onClick={() => {
              setEditando(null);
              setForm({ nome: '', senha: '', permissao: 'usuario' });
              setMostrandoFormulario(true);
            }}
          />
        </div>

        {/* Lista de Usuários */}
        <div className="border rounded p-4 bg-white shadow">
          {usuarios.length === 0 ? (
            <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm text-black">
              <thead className="text-gray-700">
                <tr>
                  <th className="py-2">Nome</th>
                  <th className="py-2">Permissão</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-gray-200">
                    <td className="py-2">{u.nome}</td>
                    <td>
                      {u.permissao === 'super' ? 'Super-Usuário' : 'Funcionário'}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleEditar(u.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(u.id)}
                        className="text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulário */}
        {mostrandoFormulario && (
          <div className="border rounded p-4 bg-white shadow space-y-4">
            <Input
              label="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              label="Senha"
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
            />
            <Select
              label="Permissão"
              value={form.permissao}
              onChange={(e) =>
                setForm({ ...form, permissao: e.target.value as Usuario['permissao'] })
              }
              options={[
                { label: 'Funcionário', value: 'usuario' },
                { label: 'Super-Usuário', value: 'super' },
              ]}
            />
            <div className="flex gap-4 pt-2">
              <Botao texto={editando ? 'Salvar Alterações' : 'Criar Usuário'} onClick={handleSalvar} />
              <Botao texto="Cancelar" variant="secondary" onClick={resetarFormulario} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
