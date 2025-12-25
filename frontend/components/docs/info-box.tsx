import { AlertCircle, Info, Lightbulb, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoBoxProps {
    type: "info" | "warning" | "tip" | "error"
    title?: string
    children: React.ReactNode
}

const styles = {
    info: {
        container: "bg-gray-50 border-gray-200",
        icon: "text-gray-600",
        titleColor: "text-gray-900",
        textColor: "text-gray-700",
        Icon: Info,
    },
    warning: {
        container: "bg-gray-50 border-gray-200",
        icon: "text-gray-600",
        titleColor: "text-gray-900",
        textColor: "text-gray-700",
        Icon: AlertTriangle,
    },
    tip: {
        container: "bg-gray-50 border-gray-200",
        icon: "text-gray-600",
        titleColor: "text-gray-900",
        textColor: "text-gray-700",
        Icon: Lightbulb,
    },
    error: {
        container: "bg-gray-50 border-gray-200",
        icon: "text-gray-600",
        titleColor: "text-gray-900",
        textColor: "text-gray-700",
        Icon: AlertCircle,
    },
}

export function InfoBox({ type, title, children }: InfoBoxProps) {
    const style = styles[type]
    const Icon = style.Icon

    return (
        <div className={cn("border rounded-lg p-4", style.container)}>
            <div className="flex gap-3">
                <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.icon)} />
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className={cn("font-medium mb-1.5 text-sm", style.titleColor)}>
                            {title}
                        </h3>
                    )}
                    <div className={cn("text-sm", style.textColor)}>{children}</div>
                </div>
            </div>
        </div>
    )
}
