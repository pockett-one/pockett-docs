import { SUGGESTED_WORKSPACE_FOLDER_NAME } from '@/lib/suggested-workspace-folder-name'

export type WorkspaceUniqueFolderLocation = 'my-drive' | 'shared-drive'

function randomSuffixId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Unique workspace folder name: same base convention as onboarding (incl. WORKSPACE_ENV suffix)
 * plus a location-specific slug so picker search does not collide with the default onboarding folder.
 */
export function generateUniqueWorkspaceFolderName(location: WorkspaceUniqueFolderLocation): string {
  const trimmed = SUGGESTED_WORKSPACE_FOLDER_NAME.replace(/_+$/g, '')
  const id = randomSuffixId()
  const tag = location === 'shared-drive' ? 'shared' : 'my'
  return `${trimmed}_${tag}_${id}_`
}

/** @deprecated Use generateUniqueWorkspaceFolderName('shared-drive') */
export function generateUniqueSharedWorkspaceFolderName(): string {
  return generateUniqueWorkspaceFolderName('shared-drive')
}
