import type { CapabilitySet } from './types'

/**
 * Simplified Persona to Capability Mapping
 * 
 * This is the single source of truth for what each persona can do.
 * It replaces the complex DB-based RBAC for improved performance and simplicity.
 */
/**
 * RBAC v2: scope-based roles. Slugs match OrgRole/ProjectRole enums and Persona table.
 */
export const PERSONA_CAPABILITY_MAP: Record<string, CapabilitySet> = {
    org_admin: {
        'org:can_manage': true,
        'client:can_manage': true,
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': true,
        'project:can_edit': true,
    },
    org_member: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': false,
        'project:can_edit': false,
    },
    proj_admin: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': true,
        'project:can_edit': true,
    },
    proj_member: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': false,
        'project:can_edit': true,
    },
    proj_ext_collaborator: {
        'project:can_view': true,
        'project:can_view_internal': false,
        'project:can_manage': false,
        'project:can_edit': true,
    },
    proj_viewer: {
        'project:can_view': true,
        'project:can_view_internal': false,
        'project:can_manage': false,
        'project:can_edit': false,
    },
    sys_admin: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': true,
        'project:can_edit': true,
    },
}

/** Valid persona slugs (least-privilege: reject unknown inputs). */
const VALID_PERSONAS = new Set(Object.keys(PERSONA_CAPABILITY_MAP))

/**
 * Helper to get capabilities for a persona slug.
 * Safety: returns empty set for null, undefined, or unknown persona.
 */
export function getCapabilitiesForPersona(personaSlug: string | null | undefined): CapabilitySet {
    if (!personaSlug || typeof personaSlug !== 'string') return {}
    if (!VALID_PERSONAS.has(personaSlug)) return {}
    return PERSONA_CAPABILITY_MAP[personaSlug] ?? {}
}

/**
 * Helper to merge multiple persona capabilities (e.g. if a user has multiple roles in an org)
 */
export function mergeCapabilities(personas: string[]): CapabilitySet {
    const merged: CapabilitySet = {}

    for (const slug of personas) {
        const caps = getCapabilitiesForPersona(slug)
        for (const [key, value] of Object.entries(caps)) {
            if (value === true) {
                merged[key as keyof CapabilitySet] = true
            }
        }
    }

    return merged
}
