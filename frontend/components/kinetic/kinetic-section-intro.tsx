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

/** Mid-page section titles (bento, secondary strips). */
export const kineticSectionTitleClassName =
  "text-4xl font-bold tracking-tighter text-[#1b1b1d] md:text-5xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

/**
 * Same type scale as `KineticHeroSection` h1 — use for page-level intros (contact, privacy, etc.).
 * Layout constraints like `max-w-*` stay on the page or via `titleClassName`.
 */
export const kineticLandingHeroTitleClassName =
  "text-5xl font-bold leading-[0.92] tracking-tighter text-[#1b1b1d] sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-8xl [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"

/** Default section lead — same scale as `KineticHeroSection` subhead (`text-lg` / `md:text-xl`). */
export const kineticSectionLeadClassName =
  "text-lg leading-relaxed text-[#45474c] md:text-xl [font-family:var(--font-kinetic-body),system-ui,sans-serif]"

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
  /**
   * `"hero"` uses the same title scale as the landing `KineticHeroSection` h1.
   * `"section"` keeps the smaller mid-page headline scale. Lead copy always uses `kineticSectionLeadClassName` (hero subhead scale).
   */
  titleScale?: "section" | "hero"
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
  titleScale = "section",
}: KineticSectionIntroProps) {
  const TitleTag = heading === "h1" ? "h1" : "h2"
  const titleBase =
    titleScale === "hero" ? kineticLandingHeroTitleClassName : kineticSectionTitleClassName
  const leadBase = kineticSectionLeadClassName
  const defaultDescWrap = cn(leadBase, "max-w-3xl")

  const titleLeading =
    titleScale === "hero"
      ? compact
        ? "mb-3 md:mb-4"
        : "mb-4 md:mb-5"
      : compact
        ? "mb-3 leading-[1.08] md:mb-4"
        : "mb-4 leading-[1.08] md:mb-5"

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
          titleBase,
          titleLeading,
          titleClassName
        )}
      >
        {title}
      </TitleTag>
      {description != null ? (
        typeof description === "string" ? (
          <p className={cn(leadBase, descriptionClassName ?? "max-w-3xl")}>{description}</p>
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
