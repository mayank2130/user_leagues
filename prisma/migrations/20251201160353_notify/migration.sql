-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "viewedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "viewedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Feedback_viewedByAdmin_idx" ON "Feedback"("viewedByAdmin");

-- CreateIndex
CREATE INDEX "Ticket_viewedByAdmin_idx" ON "Ticket"("viewedByAdmin");
