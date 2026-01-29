export const PERMISSIONS = {
    CAN_VIEW: 'can_view',
    CAN_EDIT: 'can_edit',
    CAN_MANAGE: 'can_manage'
} as const

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS]
