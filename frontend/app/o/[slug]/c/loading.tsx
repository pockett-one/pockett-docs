import { ModernSpinner } from "@/components/ui/modern-spinner"

export default function Loading() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center space-y-6">
                <ModernSpinner />
                <div className="text-center space-y-2">
                    <p className="text-base font-semibold text-slate-900">
                        Loading workspace...
                    </p>
                    <p className="text-sm text-slate-500">
                        Please wait...
                    </p>
                </div>
            </div>
        </div>
    )
}
