import { getUserOrganizations } from '@/lib/actions/organizations'
import { OrganizationsView } from '@/components/projects/organizations-view'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function OrganizationsPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // Always show organizations list - users can navigate to specific orgs from here
    // Users can access this page by clicking "Home" in breadcrumbs
    const organizations = await getUserOrganizations()

    return (
        <div className="h-full flex flex-col">
            <OrganizationsView organizations={organizations} />
        </div>
    )
}
