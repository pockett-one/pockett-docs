interface StepListProps {
    title?: string
    steps: string[]
}

export function StepList({ title, steps }: StepListProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {steps.map((step, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: step }} />
                ))}
            </ol>
        </div>
    )
}
