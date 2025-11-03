-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "checkInStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckedInDate" TIMESTAMP(3),
ADD COLUMN     "totalSessionTime" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsAwarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActivity" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMin" INTEGER NOT NULL DEFAULT 0,
    "messagesRead" INTEGER NOT NULL DEFAULT 0,
    "linksClicked" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageRead_memberId_viewedAt_idx" ON "MessageRead"("memberId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_memberId_key" ON "MessageRead"("messageId", "memberId");

-- CreateIndex
CREATE INDEX "DailyActivity_memberId_date_idx" ON "DailyActivity"("memberId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivity_memberId_date_key" ON "DailyActivity"("memberId", "date");

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivity" ADD CONSTRAINT "DailyActivity_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
