
import { Header } from "@/components/layout/Header"
import { DocsSidebar } from "@/components/docs/sidebar"

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <div className="pt-24 flex min-h-screen max-w-7xl mx-auto">
                <div className="fixed inset-y-0 top-24 z-40 hidden md:block w-64 border-r border-slate-200 bg-slate-50 pb-10 overflow-y-auto">
                    <DocsSidebar />
                </div>
                <div className="flex-1 md:pl-64">
                    <main className="px-6 py-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
