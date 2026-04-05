'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const label = '[font-family:var(--font-kinetic-headline),system-ui,sans-serif]'

interface CategoryButtonProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

export function CategoryButton({ href, children, isActive = false }: CategoryButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-[4px] px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
        label,
        isActive
          ? 'bg-[#000000] text-white'
          : 'text-[#45474c] hover:bg-[#eae7e9] hover:text-[#1b1b1d]',
      )}
    >
      {children}
    </Link>
  )
}
