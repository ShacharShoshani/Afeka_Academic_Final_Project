-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('feeding', 'walking', 'watering_plants', 'cleaning', 'stray_care', 'other');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('paid', 'volunteer', 'both');

-- AlterTable
ALTER TABLE "UserConnection" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "user1Confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "user2Confirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MatchPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careTypesWanted" "CareType"[],
    "services" "ServiceType"[],
    "availabilityWanted" "Availability"[],
    "canHostAtMine" BOOLEAN NOT NULL DEFAULT false,
    "canTravelToOther" BOOLEAN NOT NULL DEFAULT false,
    "workType" "WorkType" NOT NULL DEFAULT 'both',
    "paymentRateTypes" "PaymentRateType"[],
    "minPayment" INTEGER,
    "maxPayment" INTEGER,
    "maxDistanceKm" INTEGER,
    "residenceFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchPreference_userId_key" ON "MatchPreference"("userId");

-- AddForeignKey
ALTER TABLE "MatchPreference" ADD CONSTRAINT "MatchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
