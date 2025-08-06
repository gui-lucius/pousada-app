-- AlterTable
ALTER TABLE "CheckOut" ADD COLUMN     "faturamentoId" TEXT;

-- AlterTable
ALTER TABLE "Consumo" ADD COLUMN     "faturamentoId" TEXT;

-- CreateTable
CREATE TABLE "Faturamento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT,
    "checkinId" INTEGER,
    "nomeHospede" TEXT,
    "chale" TEXT,
    "dataEntrada" TIMESTAMP(3),
    "dataSaida" TIMESTAMP(3),
    "dataSaidaReal" TIMESTAMP(3),
    "valorHospedagem" DOUBLE PRECISION,
    "valorComanda" DOUBLE PRECISION,
    "formaPagamento" TEXT NOT NULL,
    "itensComanda" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faturamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Consumo" ADD CONSTRAINT "Consumo_faturamentoId_fkey" FOREIGN KEY ("faturamentoId") REFERENCES "Faturamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckOut" ADD CONSTRAINT "CheckOut_faturamentoId_fkey" FOREIGN KEY ("faturamentoId") REFERENCES "Faturamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faturamento" ADD CONSTRAINT "Faturamento_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "CheckIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
