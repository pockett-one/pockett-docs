-- AlterTable
ALTER TABLE "portal"."project_document_sharing" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "project_document_sharing_projectId_slug_idx" ON "portal"."project_document_sharing"("projectId", "slug");
