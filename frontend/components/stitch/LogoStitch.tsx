'use client'

import React from 'react'
import { STITCH_COLORS } from '@/config/stitch-firma-redesign'

/** P-mark grid — same geometry as `Logo`, colors from Stitch *Institutional Curator* (midnight indigo). */
function PIconStitch({
  className,
  sizeClass,
  fill = STITCH_COLORS.primary,
  stroke = STITCH_COLORS.primaryContainer,
}: {
  className?: string
  sizeClass: string
  fill?: string
  stroke?: string
}) {
  const view = 12
  const gap = 0.72
  const cell = (view - 2 * gap) / 3
  const strokeWidth = 0.22

  const cellAt = (col: number, row: number) => ({
    x: col * (cell + gap),
    y: row * (cell + gap),
  })

  const filled = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] as const
  const outline = [[2, 0], [2, 1], [1, 2], [2, 2]] as const

  return (
    <svg
      className={`${sizeClass} ${className ?? ''}`}
      viewBox={`0 0 ${view} ${view}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {filled.map(([col, row]) => {
        const { x, y } = cellAt(col, row)
        return <rect key={`f-${col}-${row}`} x={x} y={y} width={cell} height={cell} fill={fill} />
      })}
      {outline.map(([col, row]) => {
        const { x, y } = cellAt(col, row)
        return (
          <rect
            key={`o-${col}-${row}`}
            x={x + strokeWidth / 2}
            y={y + strokeWidth / 2}
            width={cell - strokeWidth}
            height={cell - strokeWidth}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        )
      })}
    </svg>
  )
}

export interface LogoStitchProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<string, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

/** Stitch alternate logo — midnight indigo P grid only (no wordmark). */
export function LogoStitch({ className = '', size = 'md' }: LogoStitchProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <PIconStitch sizeClass={sizes[size]} />
    </div>
  )
}
