import * as React from "react"
import {
  BRAND_WORDMARK_GRADIENT_HOVER_STOPS,
  BRAND_WORDMARK_GRADIENT_STOPS,
} from "@/config/brand"
import { cn } from "@/lib/utils"

const markPaths = (
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
    <path d="M9 11.2h5.7" />
  </>
)

/**
 * Lucide [square-function](https://lucide.dev/icons/square-function) geometry with the same
 * default + hover gradients as `BrandName`. Pair with an ancestor `group` (e.g. `Logo` lockup).
 */
export function BrandMarkIcon({
  className,
  title,
  variant = "default",
}: {
  className?: string
  /** Set for standalone use; omit when decorative next to the wordmark. */
  title?: string
  /** Solid lime stroke on dark backgrounds (no gradient / hover swap). */
  variant?: "default" | "onDark"
}) {
  const uid = React.useId().replace(/:/g, "")
  const defId = `${uid}-def`
  const hiId = `${uid}-hi`
  const [d0, d1, d2] = BRAND_WORDMARK_GRADIENT_STOPS
  const [h0, h1, h2] = BRAND_WORDMARK_GRADIENT_HOVER_STOPS

  if (variant === "onDark") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className={cn("shrink-0", className)}
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
      >
        {title ? <title>{title}</title> : null}
        <g
          stroke="#72ff70"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {markPaths}
        </g>
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={defId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={d0} />
          <stop offset="50%" stopColor={d1} />
          <stop offset="100%" stopColor={d2} />
        </linearGradient>
        <linearGradient id={hiId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={h0} />
          <stop offset="50%" stopColor={h1} />
          <stop offset="100%" stopColor={h2} />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${defId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-opacity duration-200 opacity-100 group-hover:opacity-0"
      >
        {markPaths}
      </g>
      <g
        stroke={`url(#${hiId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-opacity duration-200 opacity-0 group-hover:opacity-100"
      >
        {markPaths}
      </g>
    </svg>
  )
}
