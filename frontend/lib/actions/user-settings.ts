'use server'

import { createClient } from '@/utils/supabase/server'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { logger } from '@/lib/logger'

/**
 * Build UserSettingsPlus cache on login
 * Called from client-side auth flow
 */
export async function buildUserSettingsPlus(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Build and cache UserSettingsPlus
    await userSettingsPlus.getUserSettingsPlus(user.id)
    
    logger.info('Built UserSettingsPlus cache on login', 'UserSettingsPlus', { userId: user.id })
    
    return { success: true }
  } catch (error) {
    logger.error('Failed to build UserSettingsPlus', error instanceof Error ? error : new Error(String(error)))
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Invalidate UserSettingsPlus cache
 * Call after permission/settings mutations
 */
export async function invalidateUserSettingsPlus(userId: string): Promise<void> {
  userSettingsPlus.invalidateUser(userId)
}

/**
 * Invalidate UserSettingsPlus cache for multiple users
 */
export async function invalidateUsersSettingsPlus(userIds: string[]): Promise<void> {
  userSettingsPlus.invalidateUsers(userIds)
}
