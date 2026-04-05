-- Align contact_submissions with the marketing contact form: inquiry_type + message; drop legacy columns + plan.
-- Idempotent: safe to re-run after partial apply or after removing the row from public._prisma_migrations.

ALTER TABLE "system"."contact_submissions" ADD COLUMN IF NOT EXISTS "inquiry_type" TEXT;
ALTER TABLE "system"."contact_submissions" ADD COLUMN IF NOT EXISTS "message" TEXT;

-- Backfill only while the full legacy shape is present (avoids referencing dropped cols on re-run).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'system'
      AND table_name = 'contact_submissions'
      AND column_name = 'pain_point'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'system'
      AND table_name = 'contact_submissions'
      AND column_name = 'feature_request'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'system'
      AND table_name = 'contact_submissions'
      AND column_name = 'comments'
  ) THEN
    UPDATE "system"."contact_submissions"
    SET "inquiry_type" = TRIM(SUBSTRING("comments" FROM 15))
    WHERE "comments" IS NOT NULL AND "comments" LIKE 'Inquiry type:%';

    UPDATE "system"."contact_submissions"
    SET "message" = NULLIF(
      TRIM(BOTH FROM CONCAT_WS(
        E'\n\n',
        NULLIF(TRIM(BOTH FROM COALESCE("pain_point", '')), ''),
        NULLIF(TRIM(BOTH FROM COALESCE("feature_request", '')), ''),
        CASE
          WHEN "comments" IS NULL OR TRIM("comments") = '' THEN NULL::text
          WHEN "comments" LIKE 'Inquiry type:%' THEN NULL::text
          ELSE TRIM(BOTH FROM "comments")
        END
      )),
      ''
    );
  END IF;
END $$;

ALTER TABLE "system"."contact_submissions" DROP COLUMN IF EXISTS "pain_point";
ALTER TABLE "system"."contact_submissions" DROP COLUMN IF EXISTS "feature_request";
ALTER TABLE "system"."contact_submissions" DROP COLUMN IF EXISTS "comments";
ALTER TABLE "system"."contact_submissions" DROP COLUMN IF EXISTS "plan";
