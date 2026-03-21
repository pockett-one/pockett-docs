import * as React from "react"
import { BRAND_NAME, BRAND_PRIMARY_COLOR } from "@/config/brand"
import { cn } from "@/lib/utils"

export type BrandNameProps = React.ComponentPropsWithoutRef<"span">

/**
 * Renders the configured platform name (`NEXT_PUBLIC_PLATFORM_BRAND_NAME`).
 *
 * Defaults to **`BRAND_PRIMARY_COLOR`** and **`font-semibold`**. **Font size** and **line-height**
 * inherit from the parent unless you set them via `className` (e.g. `text-lg`). Override color with
 * `style`, **`!text-…`** utilities, or `[data-brand-name]` in global CSS.
 */
export const BrandName = React.forwardRef<HTMLSpanElement, BrandNameProps>(
  function BrandName({ className, style, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-brand-name
        className={cn("font-semibold", className)}
        style={{ color: BRAND_PRIMARY_COLOR, ...style }}
        {...props}
      >
        {BRAND_NAME}
      </span>
    )
  }
)

BrandName.displayName = "BrandName"
