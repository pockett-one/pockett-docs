-- Ensure RBAC v2 client-level role exists as a Persona row.
-- Slug is used in ClientMember.persona.slug and in capability mapping.

INSERT INTO "platform"."personas" ("slug", "displayName", "description")
VALUES ('client_admin', 'Client Partner', 'Client-level admin role (Client Partner)')
ON CONFLICT ("slug") DO UPDATE
SET "displayName" = EXCLUDED."displayName",
    "description" = EXCLUDED."description";

