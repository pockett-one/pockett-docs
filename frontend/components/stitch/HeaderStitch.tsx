'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandNameStitch } from '@/components/stitch/BrandNameStitch'
import { STITCH_COLORS } from '@/config/stitch-firma-redesign'
import { cn } from '@/lib/utils'
import {
  solutionsMegaMenuItems,
  TARGET_AUDIENCE_HREF,
} from '@/lib/marketing/target-audience-nav'
import { ChevronDown, Menu } from 'lucide-react'

interface HeaderStitchProps {
  onOpenModal?: (modalName: string) => void
}

const navLabel =
  'text-[11px] font-semibold uppercase tracking-[0.2em] [font-family:var(--font-stitch-label),system-ui,sans-serif] transition-colors'
/** Solutions mega-menu link rows — lighter than section titles. */
const solutionsMenuLink =
  'text-[11px] font-medium uppercase tracking-[0.2em] [font-family:var(--font-stitch-label),system-ui,sans-serif]'

function desktopNavItemClass(active: boolean) {
  return cn(
    navLabel,
    'inline-flex items-center gap-1 border-b-2 pb-1',
    active
      ? 'border-[#0060a9] text-[#041627]'
      : 'border-transparent text-[#44474c] hover:text-[#041627]'
  )
}

/**
 * Stitch *firma redesign* header — full-bleed editorial bar (mockup-aligned):
 * white surface, hairline rule, centered max-w-7xl rail, uppercase label nav, midnight CTAs.
 */
export function HeaderStitch({ onOpenModal: _onOpenModal }: HeaderStitchProps) {
  const pathname = usePathname()
  const isDevelopment = process.env.NODE_ENV === 'development'
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b border-black/[0.08] bg-white/95 backdrop-blur-md',
        '[box-shadow:0_1px_0_rgba(0,0,0,0.04),0_12px_32px_rgba(4,22,39,0.04)]'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:grid md:h-[4.25rem] md:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,1fr)] md:items-center md:justify-normal md:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 md:justify-self-start">
          <Link href="/firma-redesign" className="group min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0060a9]/30 focus-visible:ring-offset-2 rounded-sm">
            <BrandNameStitch className="text-xl leading-[1.05] tracking-[-0.02em] transition-opacity group-hover:opacity-[0.88] sm:text-2xl" />
            <p
              className="mt-1 max-w-[14rem] truncate text-[10px] font-semibold uppercase tracking-[0.2em] [font-family:var(--font-stitch-label),system-ui,sans-serif] sm:max-w-[18rem] md:max-w-none"
              style={{ color: STITCH_COLORS.onSurfaceVariant }}
            >
              Organize · Protect · Deliver
            </p>
          </Link>
          <div className="hidden h-9 w-px shrink-0 self-center bg-black/[0.08] md:block" aria-hidden />
        </div>

        <nav className="hidden gap-x-7 md:flex md:items-center md:justify-center md:justify-self-center lg:gap-x-10">
          <div className="relative group">
            <button
              type="button"
              className={cn(
                desktopNavItemClass(false),
                'cursor-pointer bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#0060a9]/30 focus-visible:ring-offset-2'
              )}
              aria-expanded="false"
              aria-haspopup="true"
            >
              Solutions
              <ChevronDown className="h-3.5 w-3.5 opacity-55" aria-hidden />
            </button>
            <div
              className={cn(
                'invisible absolute left-1/2 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-black/10 bg-white p-2 opacity-0 shadow-[0px_20px_40px_rgba(0,0,0,0.08)]',
                'transition-all duration-200 group-hover:visible group-hover:opacity-100'
              )}
            >
              <div className="flex flex-col divide-y divide-black/[0.08] overflow-hidden rounded-lg">
                {solutionsMegaMenuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={TARGET_AUDIENCE_HREF}
                    className="block px-3 py-3 first:pt-2.5 last:pb-2.5 transition-colors hover:bg-black/[0.04]"
                  >
                    <span className={cn(solutionsMenuLink, 'block text-[#181c1c]')}>{item.title}</span>
                    <span className="mt-1.5 block text-[11px] font-normal leading-snug text-[#44474c] normal-case">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/contact" className={desktopNavItemClass(pathname === '/contact')}>
            Contact
          </Link>
          <Link href="/pricing" className={desktopNavItemClass(pathname === '/pricing')}>
            Pricing
          </Link>
          <Link href="/faq" className={desktopNavItemClass(pathname === '/faq')}>
            FAQ
          </Link>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2 md:justify-self-end">
          <Link href="/" className="hidden sm:inline">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                navLabel,
                'h-9 rounded-md px-3 font-semibold normal-case tracking-normal text-[#44474c] hover:bg-black/[0.05] hover:text-[#041627]'
              )}
            >
              Classic site
            </Button>
          </Link>
          {isDevelopment && (
            <>
              <Link href="/signin" className="hidden md:inline">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-3 text-sm font-semibold text-[#44474c] hover:bg-black/[0.05]"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" className="hidden sm:inline">
                <Button
                  size="sm"
                  className="h-9 rounded-md border border-black/[0.12] bg-[#041627] px-4 text-sm font-semibold text-white shadow-none hover:bg-[#1a2b3c] sm:px-5"
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 rounded-md text-[#041627] hover:bg-black/[0.05]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw-2rem,20rem)] border-l border-black/10 bg-white p-0 sm:max-w-sm"
            >
              <SheetHeader className="border-b border-black/[0.08] px-5 py-4 text-left">
                <SheetTitle className="text-[#041627] [font-family:var(--font-stitch-display),serif] text-lg font-semibold">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-2 py-2">
                <div className="px-3 py-2">
                  <p className={cn(navLabel, 'mb-2 text-[10px] text-[#44474c]/70')}>Solutions</p>
                  <div className="mb-2 flex flex-col divide-y divide-black/[0.08] overflow-hidden rounded-lg border border-black/[0.06] bg-white">
                    {solutionsMegaMenuItems.map((item) => (
                      <SheetClose key={item.id} asChild>
                        <Link
                          href={TARGET_AUDIENCE_HREF}
                          className="px-3 py-2.5 hover:bg-black/[0.04]"
                        >
                          <span className={cn(solutionsMenuLink, 'block text-[#181c1c]')}>{item.title}</span>
                          <span className="mt-1 block text-[11px] font-normal leading-snug text-[#44474c] normal-case">
                            {item.description}
                          </span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
                {(
                  [
                    ['/contact', 'Contact'],
                    ['/pricing', 'Pricing'],
                    ['/faq', 'FAQ'],
                  ] as const
                ).map(([href, label]) => (
                  <SheetClose key={href} asChild>
                    <Link
                      href={href}
                      className={cn(
                        navLabel,
                        'rounded-lg px-5 py-3.5 text-[11px] text-[#44474c] hover:bg-black/[0.04] hover:text-[#041627]'
                      )}
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="my-2 border-t border-black/[0.06]" />
                <SheetClose asChild>
                  <Link
                    href="/"
                    className="rounded-lg px-5 py-3.5 text-sm font-medium text-[#44474c] hover:bg-black/[0.04] hover:text-[#041627]"
                  >
                    Classic site
                  </Link>
                </SheetClose>
                {isDevelopment && (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/signin"
                        className="rounded-lg px-5 py-3.5 text-sm font-medium text-[#44474c] hover:bg-black/[0.04]"
                      >
                        Sign in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/signup"
                        className="mx-3 mt-2 flex h-10 items-center justify-center rounded-md border border-black/[0.12] bg-[#041627] text-sm font-semibold text-white hover:bg-[#1a2b3c]"
                      >
                        Sign up
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
