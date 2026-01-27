import { redirect } from 'next/navigation'

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
    // Await params as required in Next.js 15+
    const { slug } = await params
    console.log('[OrganizationPage] Redirecting for slug:', slug)
    redirect(`/o/${slug}/insights`)
}
