import Link from 'next/link'
import { CalendarRange, ChevronRight } from 'lucide-react'
import roadmapData from '@/data/roadmap.json'
import type { RoadmapJson } from '@/lib/system/roadmap-layout'
import { formatDisplayDate } from '@/lib/system/roadmap-layout'
import { RoadmapGantt } from './roadmap-gantt'

const data = roadmapData as RoadmapJson

export default function SystemRoadmapPage() {
    return (
        <div className="flex flex-col space-y-8 max-w-[1200px]">
            <div className="flex flex-col space-y-4">
                <nav className="flex items-center text-sm text-gray-500">
                    <Link href="/system" className="hover:text-gray-900 transition-colors">
                        Administration
                    </Link>
                    <ChevronRight className="w-4 h-4 mx-2 shrink-0" />
                    <span className="font-medium text-gray-900">Roadmap</span>
                </nav>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <CalendarRange className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{data.meta.title}</h1>
                            <p className="text-gray-500 mt-0.5">{data.meta.subtitle}</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 space-y-1.5">
                        <p>
                            <span className="font-medium text-slate-900">MVP Standard — feature-complete target: </span>
                            <span className="tabular-nums">{formatDisplayDate(data.meta.mvpStandardFeaturesCompleteTarget)}</span>
                            <span className="text-slate-500"> (tentative)</span>
                        </p>
                        <p className="text-xs text-slate-600">
                            Data: <code className="rounded bg-white px-1 py-0.5">frontend/data/roadmap.json</code>
                            {data.git.branch && (
                                <>
                                    {' '}
                                    · Branch <span className="font-mono">{data.git.branch}</span>
                                    {data.git.headShort && (
                                        <>
                                            {' '}
                                            @ <span className="font-mono">{data.git.headShort}</span>
                                        </>
                                    )}
                                </>
                            )}
                            {data.git.recordedAt && (
                                <>
                                    {' '}
                                    · Meta synced <span className="tabular-nums">{formatDisplayDate(data.git.recordedAt)}</span>
                                </>
                            )}
                        </p>
                        {data.meta.notes && <p className="text-xs text-slate-500">{data.meta.notes}</p>}
                    </div>
                </div>
            </div>

            <RoadmapGantt data={data} />
        </div>
    )
}
