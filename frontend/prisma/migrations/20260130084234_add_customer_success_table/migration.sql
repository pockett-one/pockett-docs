-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('BUG', 'REQUEST', 'ENQUIRY');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."customer_success" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "public"."TicketType" NOT NULL,
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "errorDetails" JSONB,
    "metadata" JSONB,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_success_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_success_userId_idx" ON "public"."customer_success"("userId");

-- CreateIndex
CREATE INDEX "customer_success_status_idx" ON "public"."customer_success"("status");
