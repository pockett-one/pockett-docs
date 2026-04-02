'use client'

import { ReactNode } from 'react'
import { HeaderStitch } from '@/components/stitch/HeaderStitch'
import { FooterStitch } from '@/components/stitch/FooterStitch'
import { STITCH_COLORS } from '@/config/stitch-firma-redesign'

interface StitchPublicLayoutProps {
  children: ReactNode
  showFooter?: boolean
  onOpenModal?: (modalName: string) => void
}

/** Page shell for Stitch *firma redesign* — cool pearl surface, soft ambient light (no peach grid). */
export function StitchPublicLayout({
  children,
  showFooter = true,
  onOpenModal,
}: StitchPublicLayoutProps) {
  return (
    <div
      className="min-h-screen overflow-hidden selection:bg-[#1a2b3c] selection:text-white"
      style={{
        backgroundColor: STITCH_COLORS.surface,
        color: STITCH_COLORS.onSurface,
      }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-20%] right-[-10%] w-[min(90vw,720px)] h-[min(90vw,720px)] rounded-full opacity-40 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${STITCH_COLORS.secondary}22 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[-25%] left-[-15%] w-[min(80vw,560px)] h-[min(80vw,560px)] rounded-full opacity-30 blur-[90px]"
          style={{ background: `radial-gradient(circle, ${STITCH_COLORS.primaryContainer}33 0%, transparent 70%)` }}
        />
      </div>

      <HeaderStitch onOpenModal={onOpenModal} />

      <div className="relative z-10 pb-16 pt-20 md:pt-24 lg:pb-20">{children}</div>

      {showFooter && <FooterStitch onOpenModal={onOpenModal} />}
    </div>
  )
}
