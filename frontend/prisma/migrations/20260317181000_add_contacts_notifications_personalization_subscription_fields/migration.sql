-- Organization: subscription scaffolding fields (Polar later)
ALTER TABLE "platform"."organizations"
  ADD COLUMN IF NOT EXISTS "subscriptionProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "polarCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "polarSubscriptionId" TEXT;

-- Client contacts
CREATE TABLE IF NOT EXISTS "platform"."client_contacts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "title" TEXT,
  "notes" TEXT,
  CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "client_contacts_org_client_idx" ON "platform"."client_contacts" ("organizationId", "clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "client_contacts_client_email_key" ON "platform"."client_contacts" ("clientId", "email");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'platform'
      AND t.relname = 'client_contacts'
      AND c.conname = 'client_contacts_clientId_fkey'
  ) THEN
    ALTER TABLE "platform"."client_contacts"
      ADD CONSTRAINT "client_contacts_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "platform"."client_contacts" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='platform' AND tablename='client_contacts' AND policyname='client_contacts_isolation'
  ) THEN
    CREATE POLICY "client_contacts_isolation" ON "platform"."client_contacts"
      FOR ALL USING (
        "organizationId" = ANY(platform.get_current_user_organization_ids())
        AND platform.is_user_client_member("clientId")
      );
  END IF;
END $$;

-- Notifications (per-user, scoped to client; project/document optional)
CREATE TABLE IF NOT EXISTS "platform"."notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "organizationId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "projectId" UUID,
  "documentId" UUID,
  "userId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "ctaUrl" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "channels" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "dedupeKey" TEXT,
  "readAt" TIMESTAMPTZ(6),
  "deliveredAt" TIMESTAMPTZ(6),
  "emailSentAt" TIMESTAMPTZ(6),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_org_client_user_idx" ON "platform"."notifications" ("organizationId", "clientId", "userId");
CREATE INDEX IF NOT EXISTS "notifications_scope_idx" ON "platform"."notifications" ("clientId", "projectId", "documentId");
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "platform"."notifications" ("userId", "readAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'platform'
      AND t.relname = 'notifications'
      AND c.conname = 'notifications_projectId_fkey'
  ) THEN
    ALTER TABLE "platform"."notifications"
      ADD CONSTRAINT "notifications_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'platform'
      AND t.relname = 'notifications'
      AND c.conname = 'notifications_documentId_fkey'
  ) THEN
    ALTER TABLE "platform"."notifications"
      ADD CONSTRAINT "notifications_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "platform"."project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "platform"."notifications" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='platform' AND tablename='notifications' AND policyname='notifications_isolation'
  ) THEN
    CREATE POLICY "notifications_isolation" ON "platform"."notifications"
      FOR ALL USING (
        "organizationId" = ANY(platform.get_current_user_organization_ids())
        AND "userId" = platform.current_user_id()
      );
  END IF;
END $$;

-- User personalization (bookmarks JSONB by userId)
CREATE TABLE IF NOT EXISTS "platform"."user_personalizations" (
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "bookmarks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT "user_personalizations_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "platform"."user_personalizations" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='platform' AND tablename='user_personalizations' AND policyname='user_personalizations_isolation'
  ) THEN
    CREATE POLICY "user_personalizations_isolation" ON "platform"."user_personalizations"
      FOR ALL USING ("userId" = platform.current_user_id());
  END IF;
END $$;

