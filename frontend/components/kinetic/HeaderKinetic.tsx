'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BRAND_NAME } from '@/config/brand'
import { cn } from '@/lib/utils'
import {
  solutionsMegaMenuItems,
  TARGET_AUDIENCE_HREF_FIRMA_REDESIGN,
} from '@/lib/marketing/target-audience-nav'
import { ChevronDown, Menu } from 'lucide-react'

interface HeaderKineticProps {
  onOpenModal?: (modalName: string) => void
}

const label = 'text-[11px] font-bold uppercase tracking-[0.2em] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]'
/** Solutions mega-menu rows — match main nav weight (medium, not bold). */
const solutionsMenuLink =
  'text-[11px] font-medium uppercase tracking-[0.2em] [font-family:var(--font-kinetic-headline),system-ui,sans-serif]'

function navClass(active: boolean) {
  return cn(
    label,
    'border-b-2 pb-1 transition-colors',
    active ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-600 hover:text-slate-900'
  )
}

/** Navigation shell from *Kinetic Institution Edition* (Stitch full landing). */
export function HeaderKinetic({ onOpenModal: _onOpenModal }: HeaderKineticProps) {
  const pathname = usePathname()
  const isDevelopment = process.env.NODE_ENV === 'development'
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-black/[0.06]">
      <div className="mx-auto flex h-16 max-w-[100vw] items-center justify-between gap-4 px-4 sm:px-8 md:grid md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)] md:items-center lg:h-[4.25rem]">
        <div className="flex items-center gap-8 md:justify-self-start">
          <Link
            href="/firma-redesign"
            className="text-2xl font-bold tracking-tighter text-slate-900 [font-family:var(--font-kinetic-headline),system-ui,sans-serif]"
          >
            {BRAND_NAME}
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <div className="relative group">
              <button type="button" className={cn(navClass(false), 'inline-flex items-center gap-1 bg-transparent')}>
                Solutions
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-black/10 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                <div className="flex flex-col divide-y divide-black/[0.08] overflow-hidden rounded-md">
                  {solutionsMegaMenuItems.map((item) => (
                    <Link
                      key={item.id}
                      href={TARGET_AUDIENCE_HREF_FIRMA_REDESIGN}
                      className="block px-3 py-3 first:pt-2.5 last:pb-2.5 hover:bg-black/[0.04]"
                    >
                      <span className={cn(solutionsMenuLink, 'block text-slate-700')}>{item.title}</span>
                      <span className="mt-1.5 block text-[11px] font-normal leading-snug text-slate-500 normal-case [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/contact" className={navClass(pathname === '/contact')}>
              Contact
            </Link>
            <Link href="/pricing" className={navClass(pathname === '/pricing')}>
              Pricing
            </Link>
            <Link href="/faq" className={navClass(pathname === '/faq')}>
              FAQ
            </Link>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-3 md:justify-self-end">
          <Link href="/" className="hidden sm:inline">
            <Button variant="ghost" size="sm" className={cn(label, 'normal-case tracking-normal font-semibold text-slate-600')}>
              Classic site
            </Button>
          </Link>
          {isDevelopment && (
            <Link href="/signup" className="hidden md:inline-flex">
              <Button
                size="sm"
                className="rounded-md bg-[#72ff70] px-5 font-bold tracking-widest text-[#002203] hover:brightness-110 [font-family:var(--font-kinetic-headline),system-ui,sans-serif] shadow-sm"
              >
                Deploy
              </Button>
            </Link>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-slate-900" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l border-black/10 bg-white w-[min(100vw-2rem,22rem)]">
              <SheetHeader className="border-b border-black/[0.06] pb-4 text-left">
                <SheetTitle className="[font-family:var(--font-kinetic-headline),system-ui,sans-serif] text-lg font-bold">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 py-4">
                <p className={cn(label, 'px-4 py-2 text-[10px] text-slate-500')}>Solutions</p>
                <div className="mx-4 flex flex-col divide-y divide-black/[0.08] overflow-hidden rounded-lg border border-black/[0.08] bg-white">
                {solutionsMegaMenuItems.map((item) => (
                  <SheetClose key={item.id} asChild>
                    <Link
                      href={TARGET_AUDIENCE_HREF_FIRMA_REDESIGN}
                      className="px-4 py-2.5 hover:bg-black/[0.04]"
                    >
                      <span className={cn(solutionsMenuLink, 'block text-slate-700')}>{item.title}</span>
                      <span className="mt-1 block text-[11px] font-normal leading-snug text-slate-500 normal-case [font-family:var(--font-kinetic-body),system-ui,sans-serif]">
                        {item.description}
                      </span>
                    </Link>
                  </SheetClose>
                ))}
                </div>
                {(
                  [
                    ['/contact', 'Contact'],
                    ['/pricing', 'Pricing'],
                    ['/faq', 'FAQ'],
                    ['/', 'Classic site'],
                  ] as const
                ).map(([href, name]) => (
                  <SheetClose key={href} asChild>
                    <Link href={href} className={cn(label, 'px-4 py-3 text-slate-700 rounded-lg hover:bg-black/[0.04]')}>
                      {name}
                    </Link>
                  </SheetClose>
                ))}
                {isDevelopment && (
                  <SheetClose asChild>
                    <Link href="/signup" className="mx-4 mt-4 flex h-11 items-center justify-center rounded-md bg-[#72ff70] font-bold text-[#002203]">
                      Deploy
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
