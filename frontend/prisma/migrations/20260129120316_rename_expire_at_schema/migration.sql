/*
  Warnings:

  - You are about to drop the column `expiredAt` on the `project_invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."project_invitations" DROP COLUMN "expiredAt",
ADD COLUMN     "expireAt" TIMESTAMP(3);
