import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { FirmService } from '@/lib/firm-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ slug: null, onboardingComplete: false }, { status: 200 })

    const defaultFirm = await FirmService.getDefaultFirm(user.id)
    const slug = defaultFirm?.slug ?? null
    const settings = defaultFirm?.settings as any
    const onboardingComplete = settings?.onboarding?.isComplete === true

    return NextResponse.json({ slug, onboardingComplete })
  } catch {
    return NextResponse.json({ slug: null, onboardingComplete: false }, { status: 200 })
  }
}

