-- Add per-message emoji reactions (JSONB) and allow UPDATE only for reactions.

ALTER TABLE "platform"."doc_comment_messages"
  ADD COLUMN IF NOT EXISTS "reactions" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Replace the immutability trigger with a restricted-update trigger:
-- allow UPDATE only when changing reactions; block any other column updates.
CREATE OR REPLACE FUNCTION "platform"."prevent_update_doc_comment_messages"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow updates ONLY when reactions changes and all other fields stay identical.
  IF (OLD."reactions" IS DISTINCT FROM NEW."reactions")
     AND (OLD."content" = NEW."content")
     AND (OLD."authorUserId" IS NOT DISTINCT FROM NEW."authorUserId")
     AND (OLD."organizationId" = NEW."organizationId")
     AND (OLD."clientId" = NEW."clientId")
     AND (OLD."projectId" = NEW."projectId")
     AND (OLD."projectDocumentId" = NEW."projectDocumentId")
     AND (OLD."createdAt" = NEW."createdAt")
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'UPDATE not allowed on platform.doc_comment_messages (only reactions may be updated)';
END;
$$;

