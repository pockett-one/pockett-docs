"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Bug } from "lucide-react"
import { useState } from "react"

export function SentryTestButton() {
    const [shouldError, setShouldError] = useState(false)

    if (shouldError) {
        throw new Error("Sentry Test Error: Client-side exception (Admin Triggered)")
    }

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={() => setShouldError(true)}
            className="gap-2"
        >
            <Bug className="h-4 w-4" />
            Test Sentry Error
        </Button>
    )
}
