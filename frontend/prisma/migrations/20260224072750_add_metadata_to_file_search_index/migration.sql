-- AlterTable
ALTER TABLE "portal"."file_search_index" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';
