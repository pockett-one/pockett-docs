
import { cn } from "@/lib/utils"

interface ModernSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function ModernSpinner({ className, ...props }: ModernSpinnerProps) {
    return (
        <div className={cn("relative h-20 w-20", className)} {...props}>
            {/* Outer ring */}
            <div className="h-full w-full rounded-full border-4 border-slate-200"></div>
            {/* Animated spinning ring */}
            <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
            {/* Inner pulsing dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 bg-slate-900 rounded-full animate-pulse"></div>
        </div>
    )
}
