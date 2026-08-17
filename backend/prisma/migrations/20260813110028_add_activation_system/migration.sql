/*
  Warnings:

  - You are about to drop the column `usedAt` on the `ActivationCode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ActivationCode" DROP COLUMN "usedAt",
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ActivationCode_used_idx" ON "ActivationCode"("used");

-- CreateIndex
CREATE INDEX "ActivationCode_userId_idx" ON "ActivationCode"("userId");

-- CreateIndex
CREATE INDEX "ActivationCode_expiresAt_idx" ON "ActivationCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
