/*
  Warnings:

  - Added the required column `updatedAt` to the `CheckIn` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "acompanhantes" JSONB,
ADD COLUMN     "adultos" TEXT,
ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "criancas0a3" TEXT,
ADD COLUMN     "criancas4a9" TEXT,
ADD COLUMN     "dataNascimento" TEXT,
ADD COLUMN     "descontoPersonalizado" TEXT,
ADD COLUMN     "documento" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "nacionalidade" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "sexo" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valorEntrada" TEXT;
