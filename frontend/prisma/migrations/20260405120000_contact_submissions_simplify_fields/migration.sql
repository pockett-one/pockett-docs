-- Align contact_submissions with the marketing contact form: first-class inquiry_type + message.

ALTER TABLE "system"."contact_submissions" ADD COLUMN "inquiry_type" TEXT;
ALTER TABLE "system"."contact_submissions" ADD COLUMN "message" TEXT;

-- inquiry_type from legacy "Inquiry type: …" comments (current frontend encoding)
UPDATE "system"."contact_submissions"
SET "inquiry_type" = TRIM(SUBSTRING("comments" FROM 15))
WHERE "comments" IS NOT NULL AND "comments" LIKE 'Inquiry type:%';

-- message: pain_point / feature_request plus non–inquiry-type comments
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

ALTER TABLE "system"."contact_submissions" DROP COLUMN "pain_point";
ALTER TABLE "system"."contact_submissions" DROP COLUMN "feature_request";
ALTER TABLE "system"."contact_submissions" DROP COLUMN "comments";
