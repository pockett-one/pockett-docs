'use client'

import { type ReactNode, type CSSProperties } from 'react'
import { HeaderKinetic } from '@/components/kinetic/HeaderKinetic'
import { FooterKinetic } from '@/components/kinetic/FooterKinetic'
import { KINETIC_COLORS } from '@/config/kinetic-institution'

interface KineticPublicLayoutProps {
  children: ReactNode
  showFooter?: boolean
  onOpenModal?: (modalName: string) => void
}

/** Shell for Stitch *Kinetic Institution Edition* — pearl surface, lime / emerald ambient. */
export function KineticPublicLayout({ children, showFooter = true, onOpenModal }: KineticPublicLayoutProps) {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={
        {
          backgroundColor: KINETIC_COLORS.surface,
          color: KINETIC_COLORS.onSurface,
          ['--font-stitch-display' as string]: 'var(--font-kinetic-headline)',
          ['--font-stitch-label' as string]: 'var(--font-kinetic-headline)',
        } as CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute top-[-18%] right-[-8%] h-[min(88vw,680px)] w-[min(88vw,680px)] rounded-full opacity-35 blur-[100px]"
          style={{ background: `radial-gradient(circle, #72ff7044 0%, transparent 72%)` }}
        />
        <div
          className="absolute bottom-[-22%] left-[-12%] h-[min(78vw,520px)] w-[min(78vw,520px)] rounded-full opacity-25 blur-[90px]"
          style={{ background: `radial-gradient(circle, #5a78ff33 0%, transparent 70%)` }}
        />
      </div>

      <HeaderKinetic onOpenModal={onOpenModal} />

      <div className="relative z-10 pb-16 pt-20 md:pt-24">{children}</div>

      {showFooter && <FooterKinetic onOpenModal={onOpenModal} />}
    </div>
  )
}
