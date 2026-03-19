"use client"

import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4 w-full">
            <div className="rounded-full bg-slate-100 p-6 mb-6">
                <FileQuestion className="h-12 w-12 text-slate-400" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight mb-2">
                Page not found
            </h1>

            <p className="text-muted-foreground mb-8 max-w-md">
                The page you are looking for doesn't exist or has been moved. If you navigated here from a project or client link, double-check that you still have access.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="default" className="w-full sm:w-auto">
                    <Link href="/d">
                        <Home className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Link>
                </Button>

                <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.history.back()
                        }
                    }}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        </div>
    )
}
