-- CreateTable
CREATE TABLE "portal"."project_document_sharing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "project_document_sharing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_document_sharing_projectId_documentId_key" ON "portal"."project_document_sharing"("projectId", "documentId");

-- CreateIndex
CREATE INDEX "project_document_sharing_projectId_idx" ON "portal"."project_document_sharing"("projectId");

-- CreateIndex
CREATE INDEX "project_document_sharing_documentId_idx" ON "portal"."project_document_sharing"("documentId");

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "portal"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."project_document_sharing" ADD CONSTRAINT "project_document_sharing_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "portal"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
