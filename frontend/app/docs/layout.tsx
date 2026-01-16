
import { Header } from "@/components/layout/Header"
import { DocsSidebar } from "@/components/docs/sidebar"
import { Footer } from "@/components/layout/Footer"

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white relative font-sans selection:bg-purple-500 selection:text-white">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Dot Grid */}
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
                {/* Subtle Purple Haze */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            <Header />

            <div className="flex-1 flex flex-col pt-24 relative z-10">
                <div className="flex-1 w-full max-w-7xl mx-auto flex">
                    <aside className="hidden md:block w-80 flex-shrink-0 sticky top-24 h-[calc(100vh-6rem)]">
                        <DocsSidebar />
                    </aside>
                    <main className="flex-1 min-w-0 px-6 py-8 md:pl-8">
                        {children}
                    </main>
                </div>
                <Footer />
            </div>
        </div>
    )
}
