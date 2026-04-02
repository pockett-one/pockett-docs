'use client'

import * as React from 'react'
import { BRAND_NAME } from '@/config/brand'
import { STITCH_COLORS } from '@/config/stitch-firma-redesign'
import { cn } from '@/lib/utils'

export type BrandNameStitchProps = React.ComponentPropsWithoutRef<'span'> & {
  /** Use Space Grotesk (label voice) instead of Newsreader */
  variant?: 'display' | 'label'
}

/**
 * Wordmark for the Stitch *firma redesign* direction: Newsreader (display) or Space Grotesk (label),
 * midnight primary (`#041627`).
 */
export const BrandNameStitch = React.forwardRef<HTMLSpanElement, BrandNameStitchProps>(
  function BrandNameStitch({ className, style, variant = 'display', ...props }, ref) {
    return (
      <span
        ref={ref}
        data-brand-name-stitch
        className={cn(
          'font-semibold tracking-tight',
          variant === 'display' && '[font-family:var(--font-stitch-display),serif]',
          variant === 'label' && '[font-family:var(--font-stitch-label),system-ui,sans-serif] uppercase tracking-widest text-xs',
          className
        )}
        style={{ color: STITCH_COLORS.primary, ...style }}
        {...props}
      >
        {BRAND_NAME}
      </span>
    )
  }
)

BrandNameStitch.displayName = 'BrandNameStitch'
