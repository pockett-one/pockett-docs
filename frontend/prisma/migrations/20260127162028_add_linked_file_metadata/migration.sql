-- AlterTable
ALTER TABLE "public"."linked_files" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';
