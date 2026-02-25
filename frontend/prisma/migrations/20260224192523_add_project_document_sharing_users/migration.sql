/*
  Warnings:

  - Made the column `organizationId` on table `project_document_sharing` required. This step will fail if there are existing NULL values in that column.
  - Made the column `externalId` on table `project_document_sharing` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "portal"."project_document_sharing" DROP CONSTRAINT "project_document_sharing_organizationid_externalid_fkey";

-- DropForeignKey
ALTER TABLE "portal"."project_document_sharing" DROP CONSTRAINT "project_document_sharing_projectid_fkey";

-- AlterTable
ALTER TABLE "portal"."project_document_sharing" ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "externalId" SET NOT NULL;

-- CreateTable
CREATE TABLE "portal"."project_document_sharing_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sharingId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "googlePermissionId" TEXT,

    CONSTRAINT "project_document_sharing_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_document_sharing_users_sharingId_idx" ON "portal"."project_document_sharing_users"("sharingId");

-- CreateIndex
CREATE UNIQUE INDEX "project_document_sharing_users_sharingId_userId_key" ON "portal"."project_document_sharing_users"("sharingId", "userId");

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portal"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_organizationId_externalId_fkey" FOREIGN KEY ("organizationId", "externalId") REFERENCES "portal"."project_document_search_index"("organizationId", "externalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_sharingId_fkey" FOREIGN KEY ("sharingId") REFERENCES "portal"."project_document_sharing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing_users" ADD CONSTRAINT "project_document_sharing_users_projectId_userId_fkey" FOREIGN KEY ("projectId", "userId") REFERENCES "portal"."project_members"("projectId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "portal"."pdsi_embedding_idx" RENAME TO "project_document_search_index_embedding_idx";

-- RenameIndex
ALTER INDEX "portal"."project_document_sharing_projectid_externalid_key" RENAME TO "project_document_sharing_projectId_externalId_key";

-- RenameIndex
ALTER INDEX "portal"."project_document_sharing_projectid_idx" RENAME TO "project_document_sharing_projectId_idx";

-- RenameIndex
ALTER INDEX "portal"."project_document_sharing_projectid_organizationid_externalid_ke" RENAME TO "project_document_sharing_projectId_organizationId_externalI_key";

-- RenameIndex
ALTER INDEX "portal"."project_document_sharing_projectid_slug_idx" RENAME TO "project_document_sharing_projectId_slug_idx";
