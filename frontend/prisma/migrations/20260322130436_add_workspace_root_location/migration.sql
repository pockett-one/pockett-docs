-- CreateEnum
CREATE TYPE "platform"."WorkspaceRootLocation" AS ENUM ('MY_DRIVE', 'SHARED_DRIVE');

-- AlterTable
ALTER TABLE "platform"."client_members" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform"."connectors" ADD COLUMN     "workspaceRootLocation" "platform"."WorkspaceRootLocation",
ADD COLUMN     "workspaceRootSharedDriveId" TEXT,
ADD COLUMN     "workspaceRootSharedDriveName" TEXT;

-- AlterTable
ALTER TABLE "platform"."doc_comment_messages" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform"."firm_members" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform"."platform_notifications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "platform"."project_members" ALTER COLUMN "updatedAt" DROP DEFAULT;
