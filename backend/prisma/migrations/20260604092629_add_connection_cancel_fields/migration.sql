-- AlterTable
ALTER TABLE "UserConnection" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT;
