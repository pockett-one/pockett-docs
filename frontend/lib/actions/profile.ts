'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { profileCopy } from '@/lib/profile-copy'

const MAX_NAME_LEN = 80

export type UpdateProfileNamesResult = { ok: true } | { error: string }

export async function updateProfileNames(
    firstName: string,
    lastName: string
): Promise<UpdateProfileNamesResult> {
    const supabase = await createClient()
    const {
        data: { user },
        error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError || !user) {
        return { error: profileCopy.unauthorized }
    }

    const first = firstName.trim()
    const last = lastName.trim()

    if (!first && !last) {
        return { error: profileCopy.bothNamesEmpty }
    }

    if (first.length > MAX_NAME_LEN || last.length > MAX_NAME_LEN) {
        return { error: profileCopy.nameTooLong }
    }

    const fullName = `${first} ${last}`.trim()
    const existing = (user.user_metadata ?? {}) as Record<string, unknown>

    const { error: updateError } = await supabase.auth.updateUser({
        data: {
            ...existing,
            first_name: first,
            last_name: last,
            full_name: fullName,
            name: fullName,
        },
    })

    if (updateError) {
        return { error: updateError.message || profileCopy.updateFailed }
    }

    revalidatePath('/d/profile')
    return { ok: true }
}
