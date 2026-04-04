import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

export type MarketingBreadcrumbItem = {
  label: string
  href?: string
}

/**
 * Kinetic marketing trail: home is an icon-only link (sr-only “Home”); segments are uppercase label-sm.
 * Aligns with `docs/design/v4/contact` and privacy-style trails.
 */
export function MarketingBreadcrumb({
  items,
  className,
}: {
  items: MarketingBreadcrumbItem[]
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn(className)}>
      <ol className="inline-flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-[#45474c] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="rounded-sm p-1 text-[#45474c] transition-colors hover:bg-[#f6f3f4] hover:text-[#006e16] -ml-1"
          >
            <Home className="h-4 w-4" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#76777d]" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-[#1b1b1d]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#1b1b1d]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
