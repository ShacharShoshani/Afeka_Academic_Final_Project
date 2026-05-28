-- CreateEnum
CREATE TYPE "PaymentRateType" AS ENUM ('hourly', 'daily', 'weekly');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "paymentRateType" "PaymentRateType";
