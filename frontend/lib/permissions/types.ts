/**
 * Permission framework types.
 * Capabilities are the vocabulary of "what can someone do"; gates are UI elements gated by capabilities.
 */

import type { PlanTier, FeatureFlagKey } from '@/lib/billing/feature-flags'
export type { PlanTier }

/** Capability keys used for gate resolution. Add new keys here as personas/features grow. */
export type ProjectCapabilityKey =
  | 'project:can_view'           // View project + Files tab (all personas with project access)
  | 'project:can_view_internal' // Members, Shares, Insights, Sources (excludes Guest, External Collaborator)
  | 'project:can_manage'        // Settings, edit, manage members (Project Lead, Client Owner, Org Owner)

/**
 * Feature capability keys for plan-gated features.
 * These match the keys in FEATURE_FLAGS and are used in GateConfig.requiredCapabilities
 * when a gate is also plan-gated (persona check + plan check).
 */
export type { FeatureFlagKey }

/** Extensible: add OrgCapabilityKey | ClientCapabilityKey for org/client-level gates later. */
export type CapabilityKey = ProjectCapabilityKey

/** Resolved capability set: each key is true iff the user/persona has that capability in context. */
export type CapabilitySet = Partial<Record<CapabilityKey, boolean>>

/** Gate identifier: which UI element (tab, sidebar item, button). */
export type ProjectGateId =
  | 'project.files'
  | 'project.members'
  | 'project.shares'
  | 'project.insights'
  | 'project.sources'
  | 'project.settings'

/** Extensible: add OrgGateId | ClientGateId later. */
export type GateId = ProjectGateId

/** Scope for filtering gates (e.g. only project-level gates). */
export type GateScope = 'project' | 'org' | 'client'

export interface GateConfig {
  id: GateId
  label: string
  scope: GateScope
  /** Required capabilities: user must have ALL (when requireAll) or ANY (when !requireAll). */
  requiredCapabilities: CapabilityKey[]
  requireAll?: boolean
  /**
   * Minimum plan required for this gate.
   * When set, users on a lower plan see the gate greyed out with an upgrade badge
   * rather than having it hidden completely (persona check failures still hide it).
   */
  requiredPlan?: PlanTier
  /** Optional: for tabs, the tab value for URL (e.g. "files", "settings"). */
  tabValue?: string
}

/**
 * Result of a gate access check that includes plan-lock state.
 * - visible: false → persona check failed, hide the element entirely
 * - visible: true, planLocked: false → fully accessible
 * - visible: true, planLocked: true → show greyed out + upgrade badge
 */
export interface GateAccessResult {
  visible: boolean
  planLocked: boolean
  requiredPlan?: PlanTier
}
