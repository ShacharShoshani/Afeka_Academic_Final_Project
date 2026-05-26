-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'accepted', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "caretakerId" TEXT,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "paymentAmount" DOUBLE PRECISION NOT NULL,
    "paymentCurrency" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetsPerJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "PetsPerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantsPerJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,

    CONSTRAINT "PlantsPerJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrayAnimalsPerJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "strayAnimalId" TEXT NOT NULL,

    CONSTRAINT "StrayAnimalsPerJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_caretakerId_fkey" FOREIGN KEY ("caretakerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetsPerJob" ADD CONSTRAINT "PetsPerJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetsPerJob" ADD CONSTRAINT "PetsPerJob_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantsPerJob" ADD CONSTRAINT "PlantsPerJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantsPerJob" ADD CONSTRAINT "PlantsPerJob_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrayAnimalsPerJob" ADD CONSTRAINT "StrayAnimalsPerJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrayAnimalsPerJob" ADD CONSTRAINT "StrayAnimalsPerJob_strayAnimalId_fkey" FOREIGN KEY ("strayAnimalId") REFERENCES "StrayAnimal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
