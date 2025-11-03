/*
  Warnings:

  - You are about to drop the `MemberProgress` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[communityId]` on the table `League` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."MemberProgress" DROP CONSTRAINT "MemberProgress_currentTierId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MemberProgress" DROP CONSTRAINT "MemberProgress_memberId_fkey";

-- DropIndex
DROP INDEX "public"."Member_communityId_role_idx";

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "currentTierId" TEXT;

-- DropTable
DROP TABLE "public"."MemberProgress";

-- CreateIndex
CREATE UNIQUE INDEX "League_communityId_key" ON "League"("communityId");

-- CreateIndex
CREATE INDEX "Member_currentTierId_idx" ON "Member"("currentTierId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_currentTierId_fkey" FOREIGN KEY ("currentTierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
