/**
 * Organization logo: upload (POST) and serve (GET).
 * Logo file is stored in Supabase Storage bucket "org-assets"; create this bucket in Supabase Dashboard (Storage) if missing.
 * Stored URL in DB is the Pockett API path (/api/organizations/[orgId]/logo), not the direct Supabase URL.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const BUCKET = 'org-assets'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/jpg']

function getSupabaseAdmin() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321")
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env for storage')
  return createClient(url, key)
}

/**
 * GET /api/organizations/[orgId]/logo
 * Serves the organization logo from Supabase Storage (Pockett API URL – no direct Supabase URL exposed).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    })
    if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const supabase = getSupabaseAdmin()
    const { data: list } = await supabase.storage.from(BUCKET).list(orgId, { limit: 1 })
    const file = list?.find((f) => f.name?.startsWith('logo.'))
    if (!file?.name) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }
    const path = `${orgId}/${file.name}`
    const { data, error } = await supabase.storage.from(BUCKET).download(path)
    if (error || !data) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }

    const blob = await data.arrayBuffer()
    const ext = file.name.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('GET org logo error', e)
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 })
  }
}

/**
 * POST /api/organizations/[orgId]/logo
 * Upload logo: validate (JPG/PNG/SVG, ≤5 MB), store in Supabase Storage, set org.logoUrl to Pockett API path.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  console.log('[Logo API] POST /api/organizations/%s/logo received', orgId)
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAuth = getSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
      include: {
        organizationPersona: {
          include: { rbacPersona: { select: { slug: true } } },
        },
      },
    })
    const personaSlug = membership?.organizationPersona?.rbacPersona?.slug
    if (personaSlug !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const type = file.type?.toLowerCase()
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Use JPG, PNG, or SVG.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Max 5 MB.' },
        { status: 400 }
      )
    }

    const ext = type === 'image/svg+xml' ? 'svg' : type === 'image/jpeg' || type === 'image/jpg' ? 'jpg' : 'png'
    const path = `${orgId}/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = getSupabaseAdmin()
    console.log('[Logo API] Uploading to Storage bucket=%s path=%s size=%d', BUCKET, path, buffer.length)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })
    if (uploadError) {
      console.error('Supabase storage upload error', uploadError)
      const msg = (uploadError.message ?? '').toLowerCase()
      let userMessage: string
      let status = 500
      if (msg.includes('bucket') || msg.includes('not found')) {
        userMessage = `Upload failed. Create the "${BUCKET}" bucket in Supabase Dashboard → Storage if it does not exist.`
      } else if (msg.includes('size') || msg.includes('large') || msg.includes('limit')) {
        userMessage = 'File too large. Max 5 MB.'
        status = 400
      } else if (msg.includes('type') || msg.includes('mime') || msg.includes('allowed') || msg.includes('invalid')) {
        userMessage = 'File type not allowed. Use JPG, PNG, or SVG.'
        status = 400
      } else if (uploadError.message && uploadError.message.length < 120 && !uploadError.message.includes('\\')) {
        userMessage = `Upload failed: ${uploadError.message}`
      } else {
        userMessage = 'Upload failed. Check file size (max 5 MB) and type (JPG, PNG, SVG).'
      }
      return NextResponse.json({ error: userMessage }, { status })
    }
    console.log('[Logo API] Storage upload OK, updating DB')

    const pockettLogoUrl = `/api/organizations/${orgId}/logo`
    const orgWithSettings = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true },
    })
    const current = (orgWithSettings?.settings as Record<string, unknown>) ?? {}
    const branding = { ...(current.branding as Record<string, unknown>), logoUrl: pockettLogoUrl }
    try {
      await prisma.organization.update({
        where: { id: orgId },
        data: { logoUrl: pockettLogoUrl, settings: { ...current, branding } },
      })
    } catch (dbError: unknown) {
      console.error('Logo DB update error', dbError)
      const msg = dbError instanceof Error ? dbError.message : 'Database update failed'
      return NextResponse.json(
        { error: `Logo uploaded but saving URL failed. Ensure the organizations table has a logoUrl column (run: npx prisma migrate deploy). Details: ${msg}` },
        { status: 500 }
      )
    }
    console.log('[Logo API] DB update OK, returning logoUrl=%s', pockettLogoUrl)
    return NextResponse.json({ logoUrl: pockettLogoUrl })
  } catch (e) {
    console.error('POST org logo error', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

async function requireOrgAdmin(request: NextRequest, orgId: string) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const supabaseAuth = getSupabaseAdmin()
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    include: { organizationPersona: { include: { rbacPersona: { select: { slug: true } } } } },
  })
  const personaSlug = membership?.organizationPersona?.rbacPersona?.slug
  if (personaSlug !== 'org_admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user }
}

/**
 * DELETE /api/organizations/[orgId]/logo
 * Remove logo: delete from Storage, set org.logoUrl and settings.branding.logoUrl to null.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  try {
    const auth = await requireOrgAdmin(request, orgId)
    if (auth.error) return auth.error

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, settings: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const supabase = getSupabaseAdmin()
    const { data: list } = await supabase.storage.from(BUCKET).list(orgId, { limit: 10 })
    const toRemove = list?.filter((f) => f.name?.startsWith('logo.')) ?? []
    for (const f of toRemove) {
      await supabase.storage.from(BUCKET).remove([`${orgId}/${f.name}`])
    }

    const current = (org.settings as Record<string, unknown>) ?? {}
    const branding = { ...(current.branding as Record<string, unknown>), logoUrl: null }
    await prisma.organization.update({
      where: { id: orgId },
      data: { logoUrl: null, settings: { ...current, branding } },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE org logo error', e)
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 })
  }
}
