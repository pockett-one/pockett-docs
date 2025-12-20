
import { DocsSidebar } from "@/components/docs/sidebar"

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <div className="fixed inset-y-0 z-50 hidden md:block">
                <DocsSidebar />
            </div>
            <div className="flex-1 md:pl-64">
                <main className="max-w-4xl mx-auto px-6 py-12">
                    {children}
                </main>
            </div>
        </div>
    )
}
