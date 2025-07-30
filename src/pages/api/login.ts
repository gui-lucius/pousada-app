import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não suportado' });
  }

  const { nome, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { nome } });
  if (!usuario) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  // Aqui está o ponto crítico: comparar a senha pura com o hash salvo no banco
  const senhaOk = await bcrypt.compare(senha, usuario.senha);
  if (!senhaOk) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  return res.status(200).json({
    usuario: { id: usuario.id, nome: usuario.nome, permissao: usuario.permissao }
  });
}
