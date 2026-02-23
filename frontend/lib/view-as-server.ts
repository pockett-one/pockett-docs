/**
 * Server-side View As: read cookie and compute effective permissions for project page.
 * Used so that "View as: Team Member" hides project settings / edits on the server-rendered page.
 */

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const VIEW_AS_COOKIE = 'pockett_view_as'

const VALID_PERSONA_SLUGS = new Set([
  'sys_admin',
  'org_admin',
  'client_admin',
  'proj_admin',
  'proj_member',
  'proj_ext_collaborator',
  'proj_guest',
])

/**
 * Read the View As persona slug from the cookie (server).
 */
export async function getViewAsPersonaFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(VIEW_AS_COOKIE)?.value
  if (!value || typeof value !== 'string') return null
  const decoded = decodeURIComponent(value)
  return VALID_PERSONA_SLUGS.has(decoded) ? decoded : null
}

/**
 * Returns true if the given persona has project can_manage or client can_manage
 * (i.e. can see project settings and perform project-level edits).
 */
export async function personaCanAccessProjectSettings(
  personaSlug: string
): Promise<boolean> {
  const persona = await prisma.rbacPersona.findUnique({
    where: { slug: personaSlug },
    include: {
      grants: {
        include: {
          scope: { select: { slug: true } },
          privilege: { select: { slug: true } },
        },
      },
    },
  })
  if (!persona) return false
  const hasProjectManage = persona.grants.some(
    (g) => g.scope.slug === 'project' && g.privilege.slug === 'can_manage'
  )
  const hasClientManage = persona.grants.some(
    (g) => g.scope.slug === 'client' && g.privilege.slug === 'can_manage'
  )
  return hasProjectManage || hasClientManage
}

/** Personas that can see Members, Shares, Insights tabs (not Guest or External Collaborator). */
const PERSONAS_CAN_VIEW_INTERNAL_TABS = new Set([
  'sys_admin',
  'org_admin',
  'client_admin',
  'proj_admin',
  'proj_member',
])

/**
 * Returns true if the given persona can see Members, Shares, and Insights tabs.
 */
export function personaCanViewProjectInternalTabs(personaSlug: string): boolean {
  return PERSONAS_CAN_VIEW_INTERNAL_TABS.has(personaSlug)
}
