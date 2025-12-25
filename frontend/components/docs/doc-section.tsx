import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocSectionProps {
    title: string
    icon: LucideIcon
    color?: "blue" | "purple" | "green" | "indigo" | "amber" | "red"
    children: React.ReactNode
}

const colorClasses = {
    blue: "border-gray-300",
    purple: "border-gray-300",
    green: "border-gray-300",
    indigo: "border-gray-300",
    amber: "border-gray-300",
    red: "border-gray-300",
}

const iconColorClasses = {
    blue: "text-gray-700",
    purple: "text-gray-700",
    green: "text-gray-700",
    indigo: "text-gray-700",
    amber: "text-gray-700",
    red: "text-gray-700",
}

export function DocSection({ title, icon: Icon, color = "blue", children }: DocSectionProps) {
    return (
        <div className={cn("border-l-3 pl-6 py-1", colorClasses[color])}>
            <div className="flex items-center gap-2.5 mb-4">
                <Icon className={cn("h-5 w-5", iconColorClasses[color])} />
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    )
}
