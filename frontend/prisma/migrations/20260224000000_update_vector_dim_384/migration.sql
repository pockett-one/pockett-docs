-- AlterTable
ALTER TABLE "portal"."file_search_index" 
ALTER COLUMN "embedding" TYPE vector(384);

-- Re-create index for cosine similarity search (using HNSW)
DROP INDEX IF EXISTS "portal"."file_search_index_embedding_idx";
CREATE INDEX "file_search_index_embedding_idx" ON "portal"."file_search_index" 
USING hnsw ("embedding" vector_cosine_ops);
