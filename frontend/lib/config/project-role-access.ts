/**
 * @deprecated This file is superseded by the declarative gate system in
 * `frontend/lib/permissions/`. Use `canManageProject()` from permission-helpers
 * or check `'project:can_manage'` via the gate config instead.
 *
 * Kept for reference only. Do not add new checks here.
 */

/** @deprecated Use the gate system (project:can_manage capability) instead. */
export const PROJECT_ROLE_ACCESS = {
  canViewProjectSettings: ['Project Lead'],
} as const

/** @deprecated Use canManageProject() from permission-helpers instead. */
export function canViewProjectSettingsByPersona(personaName: string | null | undefined): boolean {
  if (!personaName) return false
  const lower = personaName.toLowerCase()
  return PROJECT_ROLE_ACCESS.canViewProjectSettings.some(
    (name) => name.toLowerCase() === lower
  )
}
