export const ROLES = {
    ORG_OWNER: 'ORG_OWNER',
    ORG_MEMBER: 'ORG_MEMBER',
    ORG_GUEST: 'ORG_GUEST',
} as const

export type RoleName = typeof ROLES[keyof typeof ROLES]
