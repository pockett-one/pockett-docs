import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

type Bookmark = {
  id: string
  kind: 'document' | 'project' | 'comment' | 'url'
  label?: string
  url: string
  clientId?: string
  projectId?: string
  documentId?: string
  createdAt: string
}

async function getOrCreate(userId: string) {
  const row = await prisma.userPersonalization.upsert({
    where: { userId },
    update: {},
    create: { userId, bookmarks: [] as any },
    select: { userId: true, bookmarks: true },
  })
  return row
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await getOrCreate(user.id)
  return NextResponse.json({ bookmarks: row.bookmarks ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const bookmark = body?.bookmark as Partial<Bookmark>
  if (!bookmark?.url || !bookmark?.kind) return NextResponse.json({ error: 'Invalid bookmark' }, { status: 400 })

  const row = await getOrCreate(user.id)
  const existing = Array.isArray(row.bookmarks) ? (row.bookmarks as any[]) : []
  const next: Bookmark = {
    id: (bookmark.id as string) || crypto.randomUUID(),
    kind: bookmark.kind as any,
    label: bookmark.label,
    url: bookmark.url,
    clientId: bookmark.clientId,
    projectId: bookmark.projectId,
    documentId: bookmark.documentId,
    createdAt: new Date().toISOString(),
  }
  const updated = [next, ...existing].slice(0, 200)
  await prisma.userPersonalization.update({ where: { userId: user.id }, data: { bookmarks: updated as any } })

  return NextResponse.json({ success: true, bookmark: next })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = body?.id as string | undefined
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const row = await getOrCreate(user.id)
  const existing = Array.isArray(row.bookmarks) ? (row.bookmarks as any[]) : []
  const updated = existing.filter((b) => b?.id !== id)
  await prisma.userPersonalization.update({ where: { userId: user.id }, data: { bookmarks: updated as any } })

  return NextResponse.json({ success: true })
}

