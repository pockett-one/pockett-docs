/*
  Warnings:

  - You are about to drop the column `expirationDate` on the `project_invitations` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."InvitationStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "public"."project_invitations" DROP COLUMN "expirationDate",
ADD COLUMN     "expiredAt" TIMESTAMP(3);
