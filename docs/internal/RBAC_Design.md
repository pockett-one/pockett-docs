# RBAC Design for Multi-Tenant SaaS (Organization + Project Scope)

**Status:** Authoritative  
**Audience:** Product, Backend, Frontend, AI Agents  

This document defines the role model for the platform. The key design principle is **scope-based roles**, not a single hierarchy. Permissions exist at three scopes: System, Organization, and Project. A user may simultaneously hold one **organization role** and zero or more **project roles**.

---

## 1. Role Scopes

### System Scope

| slug | display_name | description |
|------|--------------|-------------|
| sys_admin | System Administrator | Platform-level administrator with full access across all organizations. Restricted to SaaS operator. |

### Organization Scope

| slug | display_name | description |
|------|--------------|-------------|
| org_admin | Organization Administrator | Manages org settings, invites users, creates and manages projects, and controls org-level permissions. |
| org_member | Organization Member | Standard member who can participate in projects they are assigned to. Cannot manage org settings. |

**Principle:** All users who participate in a project **must be members of the organization** (employees, contractors, vendors, clients). Visibility is restricted to projects they are invited to.

### Project Scope

| slug | display_name | description |
|------|--------------|-------------|
| proj_admin | Project Lead | Manages the project, including structure, content, and project members. |
| proj_member | Contributor (Internal) | Internal team member contributing to project work. Can create and edit project content. Sees all project docs. |
| proj_ext_collaborator | Contributor (External) | Contractor, consultant, or vendor with edit access limited to explicitly shared docs. |
| proj_viewer | Guest (External) | External stakeholder with read-only access. Typically sponsors, clients, or executives. |

---

## 2. Role Combination Model

Each user has **two roles**: Organization Role + Project Role

| User | Org Role | Project Role |
|------|----------|--------------|
| Alice | org_admin | proj_admin |
| Bob | org_member | proj_member |
| Vendor X | org_member | proj_ext_collaborator |
| Client Y | org_member | proj_viewer |

---

## 3. Access Matrix (4 Project Types)

| Type | Project Role | Permission | Visibility |
|------|--------------|------------|------------|
| Project Admin | proj_admin | manage | project |
| Internal Contributor | proj_member | edit | project |
| External Contributor | proj_ext_collaborator | edit | explicit |
| Guest | proj_viewer | view | explicit |

---

## 4. Database Schema

### OrgMember (org_members)

- `role`: org_admin | org_member
- `membershipType`: internal | external

### ProjectMember (project_members)

- `role`: proj_admin | proj_member | proj_ext_collaborator | proj_viewer

### Persona (personas)

Lookup table for invitations. Slugs: org_admin, org_member, proj_admin, proj_member, proj_ext_collaborator, proj_viewer, sys_admin.

---

## 5. Capability Mapping

| Slug | project:can_view | project:can_view_internal | project:can_manage |
|------|------------------|---------------------------|---------------------|
| org_admin | true | true | true |
| org_member | true | true | false |
| proj_admin | true | true | true |
| proj_member | true | true | false |
| proj_ext_collaborator | true | false | false |
| proj_viewer | true | false | false |
| sys_admin | true | true | true |

---

## 6. Document Visibility

- **proj_admin, proj_member**: See all project documents.
- **proj_ext_collaborator**: See only docs in ProjectDocumentSharing with `externalCollaborator: true`.
- **proj_viewer**: See only docs in ProjectDocumentSharing with `guest: true`.

Share toggles: External Collaborator (EC) and Guest map to these personas.

---

## 7. References

- [Pockett_Permissions_Access_Model.md](./Pockett_Permissions_Access_Model.md)
- [document-sharing.md](../mvp/document-sharing.md)
- [persona-map.ts](../../frontend/lib/permissions/persona-map.ts)
