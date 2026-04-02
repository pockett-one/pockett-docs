"use client"

import { useState } from "react"
import { KineticPublicLayout } from "@/components/kinetic/KineticPublicLayout"
import { ConsultingLandingPage } from "@/components/landing/consulting-landing-page"

export default function FirmaRedesignLandingPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  return (
    <KineticPublicLayout onOpenModal={setActiveModal}>
      <ConsultingLandingPage skin="kinetic" activeModal={activeModal} onActiveModalChange={setActiveModal} />
    </KineticPublicLayout>
  )
}
