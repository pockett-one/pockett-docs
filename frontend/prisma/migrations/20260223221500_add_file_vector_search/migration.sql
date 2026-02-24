-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create file_search_index table in portal schema with camelCase column names
CREATE TABLE IF NOT EXISTS "portal"."file_search_index" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "clientId" UUID,
    "projectId" UUID,
    "externalId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "file_search_index_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint (using double quotes for camelCase columns)
CREATE UNIQUE INDEX IF NOT EXISTS "file_search_index_org_external_idx" ON "portal"."file_search_index"("organizationId", "externalId");

-- Add index for search hierarchy performance
CREATE INDEX IF NOT EXISTS "file_search_index_org_client_project_idx" ON "portal"."file_search_index"("organizationId", "clientId", "projectId");

-- Add index for cosine similarity search (using HNSW)
CREATE INDEX IF NOT EXISTS "file_search_index_embedding_idx" ON "portal"."file_search_index" 
USING hnsw ("embedding" vector_cosine_ops);
