import type { ReactNode } from "react"
import { SquareFunction } from "lucide-react"

import { cn } from "@/lib/utils"

const headline = "[font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

export type KineticMarketingBadgeVariant = "lime" | "red"

/** Default section badge icon ([square-function](https://lucide.dev/icons/square-function)) when `badge.icon` is omitted. */
function DefaultSectionIntroBadgeIcon({ variant }: { variant?: KineticMarketingBadgeVariant }) {
  return (
    <SquareFunction
      className={cn("ds-badge-kinetic__icon shrink-0 stroke-[2]", variant === "red" && "text-white")}
      aria-hidden
    />
  )
}

/** Kinetic landing section titles — same scale as `KineticBentoSection` / privacy policy h1. */
export const kineticSectionTitleClassName =
  "text-4xl font-bold tracking-tighter text-[#1b1b1d] md:text-5xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

/** Default section lead under the title. */
export const kineticSectionLeadClassName =
  "text-lg leading-relaxed text-[#45474c] [font-family:var(--font-kinetic-body),system-ui,sans-serif]"

export type KineticMarketingBadgeProps = {
  variant?: KineticMarketingBadgeVariant
  /** Optional icon; for `lime`, prefer `className="ds-badge-kinetic__icon"` on Lucide icons. */
  icon?: ReactNode
  children: ReactNode
  className?: string
  /** Hero-style pills often use `tight`; section strips use `widest` (also the default in `.ds-badge-kinetic`). */
  tracking?: "tight" | "widest"
}

/**
 * Kinetic marketing pill: lime + dark type (default), or red + white type for occasional landing emphasis.
 * Corner radius matches header “Get started” (`rounded` = same as `Header.tsx` CTA).
 */
export function KineticMarketingBadge({
  variant = "lime",
  icon,
  children,
  className,
  tracking = "tight",
}: KineticMarketingBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded",
        variant === "lime" && ["ds-badge-kinetic", headline],
        variant === "red" && cn("bg-[#ba1a1a] text-white shadow-sm", headline),
        tracking === "tight" ? "tracking-tight" : "tracking-widest",
        className
      )}
    >
      {icon ? (
        <span
          className={cn(
            "inline-flex shrink-0 [&_svg]:size-3.5 [&_svg]:shrink-0",
            variant === "red" && "[&_svg]:stroke-white"
          )}
        >
          {icon}
        </span>
      ) : null}
      {children}
    </div>
  )
}

export type KineticSectionIntroProps = {
  className?: string
  badge?: {
    variant?: KineticMarketingBadgeVariant
    /** Omit to use the default `SquareFunction` icon (same as kinetic hero strip). */
    icon?: ReactNode
    label: ReactNode
    className?: string
    tracking?: "tight" | "widest"
  }
  title: ReactNode
  /** When omitted, no description block is rendered. */
  description?: ReactNode
  heading?: "h1" | "h2"
  titleClassName?: string
  /**
   * Wrapper classes for the description block.
   * Pass `""` to omit default lead typography (e.g. privacy uses a custom bordered `<p>`).
   */
  descriptionClassName?: string
  /** Tighter vertical rhythm (e.g. contact column beside a form). */
  compact?: boolean
}

/**
 * Badge + section-scale title + optional lead — shared across contact, privacy, and kinetic landing sections.
 */
export function KineticSectionIntro({
  className,
  badge,
  title,
  description,
  heading = "h2",
  titleClassName,
  descriptionClassName,
  compact,
}: KineticSectionIntroProps) {
  const TitleTag = heading === "h1" ? "h1" : "h2"
  const defaultDescWrap = cn(kineticSectionLeadClassName, "max-w-3xl")

  return (
    <div className={className}>
      {badge ? (
        <KineticMarketingBadge
          variant={badge.variant}
          icon={badge.icon ?? <DefaultSectionIntroBadgeIcon variant={badge.variant} />}
          tracking={badge.tracking ?? "tight"}
          className={cn(compact ? "mb-3" : "mb-4", badge.className)}
        >
          {badge.label}
        </KineticMarketingBadge>
      ) : null}
      <TitleTag
        className={cn(
          kineticSectionTitleClassName,
          compact ? "mb-3 leading-[1.08] md:mb-4" : "mb-4 leading-[1.08] md:mb-5",
          titleClassName
        )}
      >
        {title}
      </TitleTag>
      {description != null ? (
        typeof description === "string" ? (
          <p className={cn(kineticSectionLeadClassName, descriptionClassName ?? "max-w-3xl")}>{description}</p>
        ) : (
          <div
            className={
              descriptionClassName !== undefined ? descriptionClassName : defaultDescWrap
            }
          >
            {description}
          </div>
        )
      ) : null}
    </div>
  )
}
