-- CreateEnum
CREATE TYPE "StrayAnimalType" AS ENUM ('dogs', 'cats', 'birds', 'rabbits', 'reptiles');

-- CreateEnum
CREATE TYPE "PetType" AS ENUM ('dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles');

-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('small', 'medium', 'large');

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PetType" NOT NULL,
    "size" "AnimalSize" NOT NULL,
    "specialNeeds" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "estimatedBirthDate" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialNeeds" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "estimatedBirthDate" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrayAnimal" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "StrayAnimalType" NOT NULL,
    "size" "AnimalSize" NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "estimatedBirthDate" TEXT,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrayAnimal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrayAnimal" ADD CONSTRAINT "StrayAnimal_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
