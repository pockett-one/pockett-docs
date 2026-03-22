import { BRAND_NAME } from '@/config/brand'

const workspaceEnv = (
  process.env.WORKSPACE_ENV ||
  process.env.NEXT_PUBLIC_WORKSPACE_ENV ||
  ''
).trim()

/** Default workspace folder name in Drive (matches onboarding / ensureDefaultWorkspaceRoot). */
export const SUGGESTED_WORKSPACE_FOLDER_NAME = workspaceEnv
  ? `_${BRAND_NAME}_Workspace_${workspaceEnv}_`
  : `_${BRAND_NAME}_Workspace_`
