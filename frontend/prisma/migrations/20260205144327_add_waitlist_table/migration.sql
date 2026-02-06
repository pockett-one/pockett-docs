-- CreateTable
CREATE TABLE "admin"."waitlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Pro',
    "company_name" TEXT,
    "company_size" TEXT,
    "role" TEXT,
    "comments" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "admin"."waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_plan_idx" ON "admin"."waitlist"("plan");

-- CreateIndex
CREATE INDEX "waitlist_created_at_idx" ON "admin"."waitlist"("created_at");
