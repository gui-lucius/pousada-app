import Layout from '@/components/layout/Layout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Botao from '@/components/ui/Botao';
import { useState, useEffect } from 'react';
import { db } from '@/utils/db';
import { useApenasAdmin } from '@/utils/proteger';
import { usuarioAtual } from '@/utils/auth';
import bcrypt from 'bcryptjs'; 

type Usuario = {
  nome: string;
  senha: string;
  permissao: 'usuario' | 'super';
};

export default function AdminPage() {
  useApenasAdmin();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<Usuario>({ nome: '', senha: '', permissao: 'usuario' });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    const lista = await db.usuarios.toArray();
    setUsuarios(lista);
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

    const senhaCriptografada = await bcrypt.hash(form.senha, 10);

    if (editando !== null) {
      const usuarioOriginal = usuarios[editando];

      const mesmaSenha = await bcrypt.compare(form.senha, usuarioOriginal.senha);
      const novaSenha = mesmaSenha ? usuarioOriginal.senha : senhaCriptografada;

      await db.usuarios.update(usuarioOriginal.nome, {
        ...form,
        senha: novaSenha,
      });
    } else {
      await db.usuarios.add({
        ...form,
        senha: senhaCriptografada,
      });
    }

    resetarFormulario();
    carregarUsuarios();
  };

  const handleEditar = (index: number) => {
    setForm({ ...usuarios[index], senha: '' }); 
    setEditando(index);
    setMostrandoFormulario(true);
  };

  const handleExcluir = async (index: number) => {
    const atual = usuarioAtual();
    const alvo = usuarios[index];

    if (atual?.nome === alvo.nome) {
      alert('Você não pode excluir seu próprio usuário!');
      return;
    }

    const confirmar = confirm(`Tem certeza que deseja excluir "${alvo.nome}"?`);
    if (!confirmar) return;

    await db.usuarios.where('nome').equals(alvo.nome).delete();
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
                {usuarios.map((u, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="py-2">{u.nome}</td>
                    <td>
                      {u.permissao === 'super' ? 'Super-Usuário' : 'Funcionário'}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => handleEditar(i)}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluir(i)}
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
              <Botao texto={editando !== null ? 'Salvar Alterações' : 'Criar Usuário'} onClick={handleSalvar} />
              <Botao texto="Cancelar" variant="secondary" onClick={resetarFormulario} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
