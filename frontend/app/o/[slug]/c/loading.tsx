import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" message="Loading your workspace" />
        </div>
    )
}
