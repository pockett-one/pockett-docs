'use client'

/**
 * PlanBadge — inline upgrade indicator for plan-locked features.
 *
 * Render next to a greyed-out tab, button, or setting to let the user
 * know which plan they need to unlock the feature.
 *
 * Usage:
 *   <PlanBadge plan="pro" />
 *   <PlanBadge plan="business" className="ml-1.5" />
 *
 * For the parent element, add opacity-50 + pointer-events-none when planLocked.
 */

import { cn } from '@/lib/utils'
import type { PlanTier } from '@/lib/billing/feature-flags'
import { PLAN_DISPLAY_NAMES } from '@/lib/billing/feature-flags'

const PLAN_STYLES: Record<PlanTier, string> = {
  standard: 'bg-gray-100 text-gray-600 border-gray-200',
  pro: 'bg-purple-50 text-purple-700 border-purple-200',
  business: 'bg-blue-50 text-blue-700 border-blue-200',
  enterprise: 'bg-amber-50 text-amber-700 border-amber-200',
}

interface PlanBadgeProps {
  /** The minimum plan required (shown as the badge label). */
  plan: PlanTier
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
        PLAN_STYLES[plan],
        className
      )}
      title={`Requires ${PLAN_DISPLAY_NAMES[plan]} plan`}
    >
      {PLAN_DISPLAY_NAMES[plan]}
    </span>
  )
}
