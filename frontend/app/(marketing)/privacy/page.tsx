import { PrivacyPolicy } from "@/components/legal/privacy-policy"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { MARKETING_PAGE_SHELL } from "@/lib/marketing/target-audience-nav"
import { cn } from "@/lib/utils"

export default function PrivacyPolicyPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />

      <main className={cn(MARKETING_PAGE_SHELL, "relative z-10 w-full flex-1 pb-16 md:pb-24")}>
        <PrivacyPolicy variant="page" />
      </main>

      <Footer />
    </div>
  )
}
