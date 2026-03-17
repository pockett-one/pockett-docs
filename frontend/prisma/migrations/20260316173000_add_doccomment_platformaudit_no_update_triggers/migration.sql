-- Prevent UPDATE on append-only tables (enforce immutability at DB level).
-- DocCommentMessage and PlatformAuditEvent are insert-only; no row updates allowed.

CREATE OR REPLACE FUNCTION "platform"."prevent_update_doc_comment_messages"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE not allowed on platform.doc_comment_messages (append-only table)';
END;
$$;

CREATE TRIGGER "trg_prevent_update_doc_comment_messages"
  BEFORE UPDATE ON "platform"."doc_comment_messages"
  FOR EACH ROW
  EXECUTE FUNCTION "platform"."prevent_update_doc_comment_messages"();


CREATE OR REPLACE FUNCTION "platform"."prevent_update_platform_audit_events"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE not allowed on platform.platform_audit_events (append-only table)';
END;
$$;

CREATE TRIGGER "trg_prevent_update_platform_audit_events"
  BEFORE UPDATE ON "platform"."platform_audit_events"
  FOR EACH ROW
  EXECUTE FUNCTION "platform"."prevent_update_platform_audit_events"();
