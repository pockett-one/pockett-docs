/**
 * Capability resolution and gate visibility
 *
 * - resolveProjectCapabilitiesForUser(orgId, clientId, projectId): CapabilitySet from real user
 * - resolveProjectCapabilitiesForPersona(personaSlug): CapabilitySet for View As (from RBAC)
 * - canAccessGate(gateId, capabilities, orgPlan?): GateAccessResult (visible + planLocked)
 * - getVisibleGates(capabilities, orgPlan?, scope?): GateId[] the user can see (not hidden)
 * - getGateVisibilityMap(capabilities, orgPlan?, scope?): Record<gateId, GateAccessResult>
 */

import type { CapabilitySet, GateId, GateScope, GateAccessResult } from './types'
import type { PlanTier } from '@/lib/billing/feature-flags'
import { planMeetsRequirement } from '@/lib/billing/feature-flags'
import { PROJECT_GATES } from './ui-gates.config'
import {
  canViewProject,
  canViewProjectSettings,
  canViewProjectInternalTabs,
} from '@/lib/permission-helpers'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Resolve capabilities for real user (server-side, with org/client/project context)
// ---------------------------------------------------------------------------

export async function resolveProjectCapabilitiesForUser(
  orgId: string,
  clientId: string,
  projectId: string
): Promise<CapabilitySet> {
  const [canView, canViewInternal, canManage] = await Promise.all([
    canViewProject(orgId, clientId, projectId),
    canViewProjectInternalTabs(orgId, clientId, projectId),
    canViewProjectSettings(orgId, clientId, projectId),
  ])
  return {
    'project:can_view': canView,
    'project:can_view_internal': canViewInternal,
    'project:can_manage': canManage,
  }
}

// ---------------------------------------------------------------------------
// Resolve capabilities for a persona (View As; from RBAC grants)
// ---------------------------------------------------------------------------

const PERSONAS_WITH_VIEW_INTERNAL = new Set([
  'sys_admin',
  'org_admin',
  'client_admin',
  'proj_admin',
  'proj_member',
])

export async function resolveProjectCapabilitiesForPersona(
  personaSlug: string
): Promise<CapabilitySet> {
  const persona = await prisma.rbacPersona.findUnique({
    where: { slug: personaSlug },
    include: {
      grants: {
        include: {
          scope: { select: { slug: true } },
          privilege: { select: { slug: true } },
        },
      },
    },
  })

  if (!persona) {
    return {
      'project:can_view': false,
      'project:can_view_internal': false,
      'project:can_manage': false,
    }
  }

  const projectView = persona.grants.some(
    (g) => g.scope.slug === 'project' && g.privilege.slug === 'can_view'
  )
  const projectManage = persona.grants.some(
    (g) => g.scope.slug === 'project' && g.privilege.slug === 'can_manage'
  )
  const clientManage = persona.grants.some(
    (g) => g.scope.slug === 'client' && g.privilege.slug === 'can_manage'
  )

  return {
    'project:can_view': projectView,
    'project:can_view_internal': PERSONAS_WITH_VIEW_INTERNAL.has(personaSlug),
    'project:can_manage': projectManage || clientManage,
  }
}

// ---------------------------------------------------------------------------
// Gate visibility: which gates pass given a capability set + optional plan
// ---------------------------------------------------------------------------

/**
 * Check whether a single gate is accessible.
 *
 * @param gateId    - The gate to check
 * @param capabilities - The resolved RBAC capability set for this user+context
 * @param orgPlan   - Optional: the org's current plan tier. When omitted, plan checks are skipped.
 *
 * Returns:
 *   { visible: false }                          → persona check failed → hide completely
 *   { visible: true, planLocked: false }        → fully accessible
 *   { visible: true, planLocked: true, requiredPlan } → greyed out + upgrade badge
 */
export function canAccessGate(
  gateId: GateId,
  capabilities: CapabilitySet,
  orgPlan?: PlanTier
): GateAccessResult {
  const gate = PROJECT_GATES.find((g) => g.id === gateId)
  if (!gate) return { visible: false, planLocked: false }

  // 1. Persona check — if this fails, hide the element entirely
  const requireAll = gate.requireAll !== false
  const personaPass = requireAll
    ? gate.requiredCapabilities.every((key) => capabilities[key] === true)
    : gate.requiredCapabilities.some((key) => capabilities[key] === true)

  if (!personaPass) return { visible: false, planLocked: false }

  // 2. Plan check — if this fails, show greyed out + upgrade badge
  if (gate.requiredPlan && orgPlan && !planMeetsRequirement(orgPlan, gate.requiredPlan)) {
    return { visible: true, planLocked: true, requiredPlan: gate.requiredPlan }
  }

  return { visible: true, planLocked: false }
}

/**
 * Returns all gate IDs that pass the persona check (regardless of plan lock).
 * Use getGateVisibilityMap() when you also need plan-lock state.
 */
export function getVisibleGates(
  capabilities: CapabilitySet,
  orgPlan?: PlanTier,
  scope?: GateScope
): GateId[] {
  const gates = scope ? PROJECT_GATES.filter((g) => g.scope === scope) : PROJECT_GATES
  return gates
    .filter((g) => canAccessGate(g.id as GateId, capabilities, orgPlan).visible)
    .map((g) => g.id as GateId)
}

/**
 * Returns a map of gateId → GateAccessResult for easy lookup in UI.
 * Only includes gates that pass the persona check (visible: true).
 * Each result also carries planLocked + requiredPlan for upgrade badge rendering.
 */
export function getGateVisibilityMap(
  capabilities: CapabilitySet,
  orgPlan?: PlanTier,
  scope?: GateScope
): Record<string, GateAccessResult> {
  const gates = scope ? PROJECT_GATES.filter((g) => g.scope === scope) : PROJECT_GATES
  const map: Record<string, GateAccessResult> = {}
  for (const g of gates) {
    const result = canAccessGate(g.id as GateId, capabilities, orgPlan)
    map[g.id] = result
  }
  return map
}
