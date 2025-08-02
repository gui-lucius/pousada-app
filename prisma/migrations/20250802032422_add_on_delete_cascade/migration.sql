-- DropForeignKey
ALTER TABLE "CheckOut" DROP CONSTRAINT "CheckOut_checkinId_fkey";

-- DropForeignKey
ALTER TABLE "Consumo" DROP CONSTRAINT "Consumo_checkinId_fkey";

-- AddForeignKey
ALTER TABLE "Consumo" ADD CONSTRAINT "Consumo_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckOut" ADD CONSTRAINT "CheckOut_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
