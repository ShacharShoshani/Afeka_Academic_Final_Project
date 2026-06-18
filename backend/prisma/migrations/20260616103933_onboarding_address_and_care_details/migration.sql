-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "allergies" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "careDetails" JSONB,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "friendliness" "PetFriendliness";

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "careDetails" JSONB,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "street" TEXT;
