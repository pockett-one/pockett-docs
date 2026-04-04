import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

export default function PrivacyPolicyPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 0.75px, transparent 0.75px)",
          backgroundSize: "16px 16px",
        }}
      />

      <Header />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8 md:pb-24">
        <PrivacyPolicy variant="page" />
      </main>

      <Footer />
    </div>
  )
}
