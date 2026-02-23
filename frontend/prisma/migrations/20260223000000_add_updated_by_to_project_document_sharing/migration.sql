-- AlterTable
ALTER TABLE "portal"."project_document_sharing" ADD COLUMN IF NOT EXISTS "updatedBy" UUID NULL;
