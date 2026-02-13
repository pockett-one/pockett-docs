export const ROLES = {
    ORG_OWNER: 'ORG_OWNER',
    ORG_MEMBER: 'ORG_MEMBER',
    // ORG_GUEST removed - not needed
} as const

export type RoleName = typeof ROLES[keyof typeof ROLES]
