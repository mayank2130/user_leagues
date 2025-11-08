/*
  Warnings:

  - You are about to drop the `DailyActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DailyActivity" DROP CONSTRAINT "DailyActivity_memberId_fkey";

-- DropTable
DROP TABLE "public"."DailyActivity";

-- CreateTable
CREATE TABLE "PointsConfig" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "dailyCheckIn" INTEGER NOT NULL DEFAULT 10,
    "messageRead" INTEGER NOT NULL DEFAULT 2,
    "sessionTime5Min" INTEGER NOT NULL DEFAULT 5,
    "streak7Days" INTEGER NOT NULL DEFAULT 35,
    "streak14Days" INTEGER NOT NULL DEFAULT 70,
    "streak30Days" INTEGER NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PointsConfig_communityId_key" ON "PointsConfig"("communityId");

-- CreateIndex
CREATE INDEX "PointsConfig_communityId_idx" ON "PointsConfig"("communityId");

-- AddForeignKey
ALTER TABLE "PointsConfig" ADD CONSTRAINT "PointsConfig_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
