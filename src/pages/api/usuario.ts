import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/utils/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          permissao: true,
          updatedAt: true,
        },
      });
      return res.status(200).json(usuarios);
    } else if (req.method === 'POST') {
      const { nome, senha, permissao } = req.body;
      if (!nome || !senha || !permissao) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
      const existente = await prisma.usuario.findUnique({ where: { nome } });
      if (existente) {
        return res.status(400).json({ error: 'Usuário já existe' });
      }
      const hash = await bcrypt.hash(senha, 10);
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          senha: hash,
          permissao,
          updatedAt: new Date(),
        },
      });
      return res.status(201).json({
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        permissao: novoUsuario.permissao,
      });
    } else if (req.method === 'PUT') {
      const { id, nome, senha, permissao } = req.body;
      if (!id || !nome || !permissao) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
      const dadosParaAtualizar: any = { nome, permissao, updatedAt: new Date() };
      if (senha) {
        dadosParaAtualizar.senha = await bcrypt.hash(senha, 10);
      }
      const atualizado = await prisma.usuario.update({
        where: { id },
        data: dadosParaAtualizar,
      });
      return res.status(200).json({
        id: atualizado.id,
        nome: atualizado.nome,
        permissao: atualizado.permissao,
      });
    } else if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });
      await prisma.usuario.delete({ where: { id } });
      return res.status(204).end();
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Método ${req.method} não permitido`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
