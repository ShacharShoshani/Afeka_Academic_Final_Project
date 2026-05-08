-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'caretaker', 'admin');

-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('mornings', 'afternoons', 'evenings', 'weekends');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "residence" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "bio" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "careTypes" "CareType"[],
    "availability" "Availability"[],
    "profilePhoto" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
