import { prisma } from './src/utils/prisma'; // ajuste o caminho se necessário
import bcrypt from 'bcryptjs';

async function criarAdminSimples() {
  const senha = '123'; // senha simples para teste
  const hash = await bcrypt.hash(senha, 10);

  const adminExistente = await prisma.usuario.findUnique({
    where: { nome: 'admin' },
  });

  if (adminExistente) {
    console.log('Usuário admin já existe');
    return;
  }

  await prisma.usuario.create({
    data: {
      nome: 'admin',
      senha: hash,
      permissao: 'super',
      updatedAt: new Date(),
    },
  });

  console.log('Usuário admin criado com senha "123"');
}

criarAdminSimples()
  .catch(console.error)
  .finally(() => process.exit());
