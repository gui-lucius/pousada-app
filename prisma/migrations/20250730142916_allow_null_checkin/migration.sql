-- DropForeignKey
ALTER TABLE "Consumo" DROP CONSTRAINT "Consumo_checkinId_fkey";

-- AlterTable
ALTER TABLE "Consumo" ALTER COLUMN "checkinId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Consumo" ADD CONSTRAINT "Consumo_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "CheckIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
