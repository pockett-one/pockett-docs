-- AlterTable
ALTER TABLE "portal"."organizations" ADD COLUMN IF NOT EXISTS "brandingSubtext" TEXT;
ALTER TABLE "portal"."organizations" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "portal"."organizations" ADD COLUMN IF NOT EXISTS "themeColorHex" TEXT;
