/*
  Warnings:

  - You are about to drop the column `authorEmail` on the `doc_comment_messages` table. All the data in the column will be lost.
  - You are about to drop the column `personaSlug` on the `doc_comment_messages` table. All the data in the column will be lost.
  - You are about to drop the column `actorEmail` on the `platform_audit_events` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `doc_comment_messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_CLOSED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_REOPENED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_SOFT_DELETED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_MEMBER_ADDED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_MEMBER_REMOVED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_MEMBER_ROLE_CHANGED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_DOCUMENT_ADDED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_DOCUMENT_REMOVED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_DOCUMENT_RENAMED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_ACTIVITY_STATUS_CHANGED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_SHARED_INTERNAL';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_SHARED_EXTERNAL';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_SHARE_FINALIZED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_SHARE_REGRANTED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_INDEX_REQUESTED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_INDEX_REQUESTED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_INDEX_COMPLETED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_CONNECTOR_FOLDER_ATTACHED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'PROJECT_SETTINGS_CHANGED';
ALTER TYPE "platform"."PlatformAuditEventType" ADD VALUE 'DOCUMENT_ACCESS_LOG_ENTRY';

-- AlterTable
ALTER TABLE "platform"."doc_comment_messages" DROP COLUMN "authorEmail",
DROP COLUMN "personaSlug",
ADD COLUMN     "clientId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "platform"."platform_audit_events" DROP COLUMN "actorEmail",
ADD COLUMN     "clientId" UUID;

-- AddForeignKey
ALTER TABLE "platform"."doc_comment_messages" ADD CONSTRAINT "doc_comment_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."platform_audit_events" ADD CONSTRAINT "platform_audit_events_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "platform"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
