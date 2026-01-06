-- DropIndex
DROP INDEX "public"."contact_submissions_ip_address_created_at_idx";

-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_members" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."linked_files" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "is_grant_revoked" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "public"."projects"("organizationId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "public"."project_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "public"."project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_files_connectorId_fileId_key" ON "public"."linked_files"("connectorId", "fileId");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."linked_files" ADD CONSTRAINT "linked_files_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "public"."connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
