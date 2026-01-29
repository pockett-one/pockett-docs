/*
  Warnings:

  - You are about to drop the column `role` on the `organization_members` table. All the data in the column will be lost.
  - You are about to drop the column `canEdit` on the `project_members` table. All the data in the column will be lost.
  - You are about to drop the column `canManage` on the `project_members` table. All the data in the column will be lost.
  - You are about to drop the column `canView` on the `project_members` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `organization_members` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'JOINED');

-- AlterTable
ALTER TABLE "public"."organization_members" DROP COLUMN "role",
ADD COLUMN     "roleId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."project_members" DROP COLUMN "canEdit",
DROP COLUMN "canManage",
DROP COLUMN "canView",
ADD COLUMN     "personaId" UUID,
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- DropEnum
DROP TYPE "public"."MemberRole";

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "displayLabel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_personas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roleId" UUID NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "personaId" UUID NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_displayLabel_key" ON "public"."role_permissions"("displayLabel");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_name_key" ON "public"."role_permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_token_key" ON "public"."project_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_projectId_email_key" ON "public"."project_invitations"("projectId", "email");

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_members" ADD CONSTRAINT "project_members_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "public"."project_personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_personas" ADD CONSTRAINT "project_personas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_personas" ADD CONSTRAINT "project_personas_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_invitations" ADD CONSTRAINT "project_invitations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_invitations" ADD CONSTRAINT "project_invitations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "public"."project_personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SEED ROLES
INSERT INTO "roles" ("name", "displayLabel", "description", "updatedAt") VALUES
('ORG_OWNER', 'Organization Owner', 'Owner of the organization with full access', NOW()),
('ORG_MEMBER', 'Organization Member', 'Internal member of the organization', NOW()),
('ORG_GUEST', 'Organization Guest', 'External guest or client', NOW())
ON CONFLICT ("name") DO NOTHING;

-- SEED ROLE PERMISSIONS
INSERT INTO "role_permissions" ("name", "displayLabel", "description", "updatedAt") VALUES
('can_view', 'View Project', 'Can perform least privilege operations such as view', NOW()),
('can_edit', 'Edit Project', 'Can perform operative tasks such as create, modify but not delete', NOW()),
('can_manage', 'Manage Project', 'Can perform elevated tasks such as setup and delete', NOW())
ON CONFLICT ("name") DO NOTHING;
