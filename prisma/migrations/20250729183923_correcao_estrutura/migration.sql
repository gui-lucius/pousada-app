/*
  Warnings:

  - You are about to drop the column `data` on the `Consumo` table. All the data in the column will be lost.
  - You are about to drop the column `item` on the `Consumo` table. All the data in the column will be lost.
  - You are about to drop the column `quantidade` on the `Consumo` table. All the data in the column will be lost.
  - You are about to drop the column `valorUnitario` on the `Consumo` table. All the data in the column will be lost.
  - Added the required column `cliente` to the `Consumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospede` to the `Consumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Consumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcomandas` to the `Consumo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Consumo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consumo" DROP COLUMN "data",
DROP COLUMN "item",
DROP COLUMN "quantidade",
DROP COLUMN "valorUnitario",
ADD COLUMN     "cliente" TEXT NOT NULL,
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hospede" BOOLEAN NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "subcomandas" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
