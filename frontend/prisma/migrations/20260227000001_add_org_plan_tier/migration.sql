-- AddColumn: planTier on organizations
ALTER TABLE "portal"."organizations" ADD COLUMN "planTier" TEXT NOT NULL DEFAULT 'standard';
