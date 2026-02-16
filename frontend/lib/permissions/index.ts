/**
 * Permission-based UI framework
 *
 * Configuration-driven gates and capability resolution. See README.md in this folder.
 */

export type {
  CapabilityKey,
  ProjectCapabilityKey,
  CapabilitySet,
  GateId,
  ProjectGateId,
  GateScope,
  GateConfig,
} from './types'

export {
  PROJECT_GATES,
  getGateById,
  getGatesByScope,
} from './ui-gates.config'

export {
  resolveProjectCapabilitiesForUser,
  resolveProjectCapabilitiesForPersona,
  canAccessGate,
  getVisibleGates,
  getGateVisibilityMap,
} from './resolve'
