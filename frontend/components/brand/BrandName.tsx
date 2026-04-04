import * as React from "react"
import { BRAND_NAME } from "@/config/brand"
import { cn } from "@/lib/utils"

/** Space Grotesk — `--font-kinetic-headline` (see `globals.css` + root `layout.tsx`). */
const brandHeadlineFont = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

/**
 * Default = softer 3-stop wordmark; hover = full-contrast black → green.
 * Hover repeats `via` as the ~50% blend so Tailwind clears the default mid stop (needs `group` on linked lockups, or `hover:` on the span).
 * Default / hover hex values must match `BRAND_WORDMARK_GRADIENT_STOPS` and `BRAND_WORDMARK_GRADIENT_HOVER_STOPS` in `config/brand.ts` (and `app/icon.svg` / `BrandMarkIcon`).
 */
const brandGradientClasses =
  "bg-gradient-to-r from-[#4d4d4d] via-[#2d6d3a] to-[#4aba5e] bg-clip-text text-transparent hover:from-[#000000] hover:via-[#00380c] hover:to-[#006e16] group-hover:from-[#000000] group-hover:via-[#00380c] group-hover:to-[#006e16]"

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
          gradient ? brandGradientClasses : "text-slate-900",
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
