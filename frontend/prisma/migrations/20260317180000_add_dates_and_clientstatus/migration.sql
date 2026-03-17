-- Add ClientStatus enum + safe conversion from TEXT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'platform' AND t.typname = 'ClientStatus'
  ) THEN
    CREATE TYPE "platform"."ClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
  END IF;
END $$;

-- Add project dates
ALTER TABLE "platform"."projects"
  ADD COLUMN IF NOT EXISTS "kickoffDate" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMPTZ(6);

-- Add document due date
ALTER TABLE "platform"."project_documents"
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMPTZ(6);

-- Convert clients.status text -> enum safely (preserve existing values)
ALTER TABLE "platform"."clients"
  ALTER COLUMN "status" DROP DEFAULT;

UPDATE "platform"."clients"
  SET "status" = 'ACTIVE'
  WHERE "status" IS NULL;

ALTER TABLE "platform"."clients"
  ALTER COLUMN "status" TYPE "platform"."ClientStatus"
  USING (upper("status"))::"platform"."ClientStatus";

ALTER TABLE "platform"."clients"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
  ALTER COLUMN "status" SET NOT NULL;

