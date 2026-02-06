
import { cn } from "@/lib/utils"

interface WorkspaceLoaderProps {
    title?: string
    subtitle?: string
    className?: string
}

export function WorkspaceLoader({
    title = "Loading workspace",
    subtitle = "This will only take a moment...",
    className
}: WorkspaceLoaderProps) {
    return (
        <div className={cn("min-h-[50vh] flex flex-col items-center justify-center space-y-6", className)}>
            {/* Modern Spinner */}
            <div className="relative h-20 w-20">
                {/* Outer ring */}
                <div className="h-full w-full rounded-full border-4 border-slate-200"></div>
                {/* Animated spinning ring */}
                <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
                {/* Inner pulsing dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 bg-slate-900 rounded-full animate-pulse"></div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
                <p className="text-base font-semibold text-slate-900">
                    {title}
                </p>
                <p className="text-sm text-slate-500">
                    {subtitle}
                </p>
            </div>

            {/* Progress indicator dots */}
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    )
}
