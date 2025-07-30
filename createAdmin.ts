import { criarUsuario } from './src/utils/auth';

async function criarAdmin() {
  await criarUsuario({
    nome: 'admin',
    senha: 'minhasenha123', // Aqui você coloca a senha que quiser
    permissao: 'super',
  });
  console.log('Usuário admin criado com sucesso!');
}

criarAdmin()
  .catch(console.error)
  .finally(() => process.exit());
