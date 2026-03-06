import type { CapabilitySet } from './types'

/**
 * Simplified Persona to Capability Mapping
 * 
 * This is the single source of truth for what each persona can do.
 * It replaces the complex DB-based RBAC for improved performance and simplicity.
 */
export const PERSONA_CAPABILITY_MAP: Record<string, CapabilitySet> = {
    org_owner: {
        'org:can_manage': true,
        'client:can_manage': true,
    },
    org_member: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': false,
    },
    project_admin: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': true,
    },
    project_editor: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': false,
    },
    project_viewer: {
        'project:can_view': true,
        'project:can_view_internal': false,
        'project:can_manage': false,
    },
    sys_admin: {
        'project:can_view': true,
        'project:can_view_internal': true,
        'project:can_manage': true,
    },
}

/**
 * Helper to get capabilities for a persona slug.
 * Fallback to empty if persona is unknown.
 */
export function getCapabilitiesForPersona(personaSlug: string | null | undefined): CapabilitySet {
    if (!personaSlug) return {}
    return PERSONA_CAPABILITY_MAP[personaSlug] || {}
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
