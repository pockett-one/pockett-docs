/**
 * UI Gates Configuration
 *
 * Single source of truth for "which UI elements exist" and "what capability is required to see them".
 * Add new gates here when you add new tabs, sidebar items, or buttons; add new capability keys in types.ts
 * and resolve them in resolve.ts when personas or RBAC rules change.
 *
 * Two dimensions control visibility:
 *   requiredCapabilities — persona/RBAC check. Failure → element is hidden completely.
 *   requiredPlan         — subscription tier check. Failure → element is visible but greyed out + badge.
 */

import type { GateConfig } from './types'

/** All project-level UI gates (tabs, sidebar sub-items). Order matches desired display order. */
export const PROJECT_GATES: GateConfig[] = [
  {
    id: 'project.files',
    label: 'Files',
    scope: 'project',
    requiredCapabilities: ['project:can_view'],
    tabValue: 'files',
  },
  {
    id: 'project.members',
    label: 'Members',
    scope: 'project',
    requiredCapabilities: ['project:can_view_internal'],
    tabValue: 'members',
  },
  {
    id: 'project.shares',
    label: 'Shares',
    scope: 'project',
    requiredCapabilities: ['project:can_view_internal'],
    tabValue: 'shares',
  },
  {
    id: 'project.insights',
    label: 'Insights',
    scope: 'project',
    requiredCapabilities: ['project:can_view_internal'],
    requiredPlan: 'pro',
    tabValue: 'insights',
  },
  {
    id: 'project.sources',
    label: 'Sources',
    scope: 'project',
    requiredCapabilities: ['project:can_view_internal'],
    tabValue: 'sources',
  },
  {
    id: 'project.settings',
    label: 'Settings',
    scope: 'project',
    requiredCapabilities: ['project:can_manage'],
    tabValue: 'settings',
  },
]

/** Lookup gate by id. */
export function getGateById(id: string): GateConfig | undefined {
  return PROJECT_GATES.find((g) => g.id === id)
}

/** Get all gates for a scope. */
export function getGatesByScope(scope: 'project' | 'org' | 'client'): GateConfig[] {
  return PROJECT_GATES.filter((g) => g.scope === scope)
}
