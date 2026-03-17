-- CreateEnum
CREATE TYPE "platform"."PlatformAuditScope" AS ENUM ('PROJECT');

-- CreateEnum
CREATE TYPE "platform"."PlatformAuditEventType" AS ENUM ('FILE_UPLOADED', 'STATUS_CHANGE', 'SHARED_EXT', 'PROJECT_LOCKED', 'PROJECT_UPDATED');

-- CreateTable
CREATE TABLE "platform"."doc_comment_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "projectDocumentId" UUID NOT NULL,
    "authorUserId" UUID,
    "authorEmail" TEXT,
    "personaSlug" TEXT,
    "content" TEXT NOT NULL,

    CONSTRAINT "doc_comment_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."platform_audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" UUID NOT NULL,
    "projectId" UUID,
    "projectDocumentId" UUID,
    "scope" "platform"."PlatformAuditScope" NOT NULL,
    "eventType" "platform"."PlatformAuditEventType" NOT NULL,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" UUID,
    "actorEmail" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doc_comment_messages_projectId_projectDocumentId_createdAt_idx" ON "platform"."doc_comment_messages"("projectId", "projectDocumentId", "createdAt");

-- CreateIndex
CREATE INDEX "platform_audit_events_projectId_eventAt_idx" ON "platform"."platform_audit_events"("projectId", "eventAt");

-- CreateIndex
CREATE INDEX "platform_audit_events_projectId_projectDocumentId_eventAt_idx" ON "platform"."platform_audit_events"("projectId", "projectDocumentId", "eventAt");

-- AddForeignKey
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "platform"."project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "platform"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "platform"."project_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "platform"."pdd_embedding_idx" RENAME TO "project_documents_embedding_idx";

-- RenameIndex
ALTER INDEX "platform"."pdd_org_client_project_idx" RENAME TO "project_documents_organizationId_clientId_projectId_idx";
