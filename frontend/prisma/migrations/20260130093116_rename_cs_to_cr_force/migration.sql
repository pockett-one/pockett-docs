/*
  Warnings:

  - You are about to drop the `customer_success` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."customer_success";

-- CreateTable
CREATE TABLE "public"."customer_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "public"."TicketType" NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "organizationId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_requests_userId_idx" ON "public"."customer_requests"("userId");

-- CreateIndex
CREATE INDEX "customer_requests_status_idx" ON "public"."customer_requests"("status");
