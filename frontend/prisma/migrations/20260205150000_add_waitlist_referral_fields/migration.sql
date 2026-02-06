-- AlterTable - Add referral columns
ALTER TABLE "admin"."waitlist" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;
ALTER TABLE "admin"."waitlist" ADD COLUMN IF NOT EXISTS "referred_by" TEXT;
ALTER TABLE "admin"."waitlist" ADD COLUMN IF NOT EXISTS "referral_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "admin"."waitlist" ADD COLUMN IF NOT EXISTS "position_boost" INTEGER NOT NULL DEFAULT 0;

-- Generate unique referral codes for existing rows
-- Using a function to generate 8-character uppercase alphanumeric codes
DO $$
DECLARE
    rec RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR rec IN SELECT id FROM "admin"."waitlist" WHERE "referral_code" IS NULL LOOP
        LOOP
            -- Generate 8-character code: uppercase letters and numbers (excluding confusing chars)
            new_code := upper(substring(md5(random()::text || rec.id::text) from 1 for 8));
            -- Replace confusing characters
            new_code := replace(replace(replace(replace(new_code, '0', 'A'), 'O', 'B'), 'I', 'C'), '1', 'D');
            
            -- Check if code already exists
            SELECT EXISTS(SELECT 1 FROM "admin"."waitlist" WHERE "referral_code" = new_code) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        UPDATE "admin"."waitlist" SET "referral_code" = new_code WHERE id = rec.id;
    END LOOP;
END $$;

-- Set NOT NULL constraint after populating existing rows
ALTER TABLE "admin"."waitlist" ALTER COLUMN "referral_code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_referral_code_idx" ON "admin"."waitlist"("referral_code");
CREATE INDEX IF NOT EXISTS "waitlist_referred_by_idx" ON "admin"."waitlist"("referred_by");
