import type { CapabilitySet } from './types'

/** Allowed scope keys for least-privilege: only these receive privileges. */
const ALLOWED_SCOPES = new Set(['firm', 'client', 'project'])

/**
 * Convert CapabilitySet to scopes format for UserSettingsPlus consumers.
 * Maps capability keys like 'project:can_edit' -> scopes.project = ['can_edit']
 * Safety: only adds to known scopes; unknown keys are ignored.
 */
export function capabilitySetToScopes(caps: CapabilitySet): Record<string, string[]> {
  const scopes: Record<string, string[]> = {
    firm: [],
    client: [],
    project: [],
  }
  for (const [key, val] of Object.entries(caps)) {
    if (val !== true) continue
    const [scope, priv] = key.split(':')
    if (!scope || !priv || !ALLOWED_SCOPES.has(scope)) continue
    const arr = scopes[scope]
    if (arr && !arr.includes(priv)) arr.push(priv)
  }
  return scopes
}
