import * as React from "react"
import { BRAND_NAME } from "@/config/brand"
import { cn } from "@/lib/utils"

/** Space Grotesk — `--font-kinetic-headline` (see `globals.css` + root `layout.tsx`). */
const brandHeadlineFont = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

export interface BrandNameProps extends React.ComponentPropsWithoutRef<"span"> {
  /** Enables the redesign-style gradient wordmark treatment. */
  gradient?: boolean
}

/**
 * Renders the configured platform name (`NEXT_PUBLIC_PLATFORM_BRAND_NAME`).
 *
 * Defaults to design1 wordmark tone (`font-bold`, `tracking-tighter`) with gradient fill.
 * **Font size** and **line-height** inherit from the parent unless you set them via `className`
 * (e.g. `text-lg`). Override color with `style`, **`!text-…`** utilities, or `[data-brand-name]`.
 */
export const BrandName = React.forwardRef<HTMLSpanElement, BrandNameProps>(
  function BrandName({ className, style, gradient = true, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-brand-name
        className={cn(
          "font-bold tracking-tighter",
          brandHeadlineFont,
          gradient
            ? "bg-gradient-to-r from-[#000000] to-[#006e16] bg-clip-text text-transparent"
            : "text-slate-900",
          className
        )}
        style={style}
        {...props}
      >
        {BRAND_NAME}
      </span>
    )
  }
)

BrandName.displayName = "BrandName"
