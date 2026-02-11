import { NextResponse } from 'next/server'
import { getDefaultOrganizationSlug } from '@/lib/actions/organizations'

export async function GET() {
    try {
        const slug = await getDefaultOrganizationSlug()
        return NextResponse.json({ slug })
    } catch (error) {
        return NextResponse.json({ slug: null }, { status: 200 })
    }
}
