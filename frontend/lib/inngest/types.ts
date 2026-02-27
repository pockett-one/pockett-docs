/**
 * Inngest Event Type Definitions
 *
 * This file defines the event payloads for async permission revocation.
 * These events are triggered when sharing settings change, member roles change,
 * or projects are archived/deleted.
 */

/**
 * Fired when Guest or External Collaborator access is disabled on a document
 */
export interface SharingSettingsUpdatedEvent {
  type: 'sharing.settings.updated'
  data: {
    projectId: string
    organizationId: string
    documentId: string // externalId from ProjectDocumentSharing (Google Drive file ID)
    sharingId: string // ProjectDocumentSharing.id
    disabledPersonas: ('guest' | 'externalCollaborator')[]
    timestamp: string
    userId: string // Supabase user ID of who made the change
  }
}

/**
 * Fired when a project member's persona (role) changes
 */
export interface ProjectMemberPersonaUpdatedEvent {
  type: 'project.member.persona.updated'
  data: {
    projectId: string
    organizationId: string
    memberId: string // ProjectMember.id
    userId: string // Supabase user ID
    oldPersonaId: string | null
    newPersonaId: string
    oldPersonaSlug: string | null // e.g., 'proj_guest', 'proj_ext_collaborator'
    newPersonaSlug: string // e.g., 'proj_team_member', 'proj_admin'
    timestamp: string
    changedBy: string // Supabase user ID of who made the change
  }
}

/**
 * Fired when a project is archived (closed) or deleted
 */
export interface ProjectArchivedEvent {
  type: 'project/archived'
  data: {
    projectId: string
    organizationId: string
    reason: 'closed' | 'deleted' // Distinguish between closure and deletion
    timestamp: string
  }
}

/**
 * Fired when a new member joins a project (invitation accepted)
 * or when a member's persona is upgraded to an access-granting role
 */
export interface ProjectMemberAddedEvent {
  type: 'project.member.added'
  data: {
    projectId: string
    organizationId: string
    memberId: string
    userId: string
    email: string
    personaSlug: string // e.g., 'proj_guest', 'proj_ext_collaborator', 'proj_team_member'
    timestamp: string
  }
}

// Union type for all permission-related events
export type PermissionEvent =
  | SharingSettingsUpdatedEvent
  | ProjectMemberPersonaUpdatedEvent
  | ProjectArchivedEvent
  | ProjectMemberAddedEvent
