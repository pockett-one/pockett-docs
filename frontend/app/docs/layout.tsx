
import { Header } from "@/components/layout/Header"
import { DocsSidebar } from "@/components/docs/sidebar"

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="pt-24 flex min-h-screen max-w-7xl mx-auto">
                <div className="fixed inset-y-0 top-24 z-40 hidden md:block w-80">
                    <DocsSidebar />
                </div>
                <div className="flex-1 md:pl-80">
                    <main className="px-6 py-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
