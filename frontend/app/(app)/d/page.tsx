import { redirect } from 'next/navigation'
import { FirmsView } from '@/components/projects/firms-view'
import { getUserFirms, type FirmOption } from '@/lib/actions/firms'

export default async function FirmsPage() {
    let firms: FirmOption[] = []
    try {
        firms = await getUserFirms()
    } catch {
        // getUserFirms may redirect on auth issues; this fallback avoids hanging if upstream throws unexpectedly.
        redirect('/d/onboarding')
    }

    if (firms.length === 0) {
        redirect('/d/onboarding')
    }

    const defaultOrgSlug = firms.find((o) => o.isDefault)?.slug ?? firms[0]?.slug
    if (defaultOrgSlug) {
        redirect(`/d/f/${defaultOrgSlug}`)
    }

    // Defensive fallback: in case all firm rows are malformed (missing slug), render picker instead of spinning.
    return (
        <div className="h-full flex flex-col p-8 bg-stone-50/30">
            <FirmsView firms={firms} activeOrgIdFromJWT={null} />
        </div>
    )
}
