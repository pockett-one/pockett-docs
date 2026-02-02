-- AlterTable
ALTER TABLE "portal"."projects" ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
