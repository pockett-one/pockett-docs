"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SentryTestPage() {
    const [shouldError, setShouldError] = useState(false);

    if (shouldError) {
        throw new Error("Sentry Test Error: Client-side exception");
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <h1 className="text-2xl font-bold">Sentry Verification</h1>
                <p className="max-w-md text-center sm:text-left">
                    Click the button below to crash this React component.
                    If Sentry is configured correctly, this error will appear in your Sentry dashboard.
                </p>

                <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => setShouldError(true)}
                >
                    Throw Test Error
                </Button>
            </main>
        </div>
    );
}
