import { addMonths, format, isValid, isWithinInterval, parseISO, startOfMonth } from 'date-fns'
import type { RoadmapJson } from '@/lib/system/roadmap-layout'
import {
    barLayout,
    barStatusStyles,
    formatDisplayDate,
    percentOnTimeline,
    roadmapTimelineMs,
} from '@/lib/system/roadmap-layout'

type Props = { data: RoadmapJson }

function monthTicks(rangeStart: string, rangeEnd: string): Date[] {
    const a = parseISO(rangeStart)
    const b = parseISO(rangeEnd)
    const ticks: Date[] = []
    let cur = startOfMonth(a)
    while (cur <= b) {
        ticks.push(cur)
        cur = addMonths(cur, 1)
    }
    return ticks
}

export function RoadmapGantt({ data }: Props) {
    const tl = roadmapTimelineMs(data.timeline.rangeStart, data.timeline.rangeEnd)
    if (!tl) {
        return <p className="text-sm text-red-600">Invalid timeline range in roadmap data.</p>
    }

    const { start, end, totalMs } = tl
    const today = new Date()
    const showToday = isWithinInterval(today, { start, end })
    const todayPct = showToday ? percentOnTimeline(today, start, totalMs) : null

    const mvpTarget = parseISO(data.meta.mvpStandardFeaturesCompleteTarget)
    const showMvpTarget =
        isValid(mvpTarget) && isWithinInterval(mvpTarget, { start, end })
    const mvpTargetPct = showMvpTarget ? percentOnTimeline(mvpTarget, start, totalMs) : null

    const sortedTracks = [...data.tracks].sort((x, y) => x.order - y.order)
    const ticks = monthTicks(data.timeline.rangeStart, data.timeline.rangeEnd)

    return (
        <div className="space-y-10">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
                <div className="min-w-[880px]">
                <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">Schedule (Gantt-style)</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Done
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" /> In progress
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Planned
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-0 w-4 border-t-2 border-dashed border-violet-500" /> MVP Standard target
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-[minmax(200px,240px)_1fr] text-xs">
                    <div className="border-b border-r border-slate-100 bg-slate-50/50 p-2 font-medium text-slate-500 uppercase tracking-wide">
                        Workstream
                    </div>
                    <div className="border-b border-slate-100 bg-slate-50/50 p-2 relative h-9">
                        <div className="absolute inset-y-0 left-0 right-0 flex">
                            {ticks.map((t) => (
                                <div
                                    key={t.toISOString()}
                                    className="flex-1 min-w-0 border-l border-slate-100 first:border-l-0 pl-1 text-[10px] text-slate-400 truncate"
                                    style={{ flexGrow: 1 }}
                                >
                                    {format(t, 'MMM yy')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {sortedTracks.map((track) => {
                        const bars = data.bars.filter((b) => b.trackId === track.id)
                        return (
                            <div key={track.id} className="contents">
                                <div className="border-b border-r border-slate-100 px-3 py-3 text-sm font-medium text-slate-800 bg-white flex items-center">
                                    {track.label}
                                </div>
                                <div className="border-b border-slate-100 relative min-h-[52px] bg-white">
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {ticks.map((t) => (
                                            <div
                                                key={`g-${track.id}-${t.toISOString()}`}
                                                className="flex-1 border-l border-slate-50 first:border-l-0"
                                            />
                                        ))}
                                    </div>

                                    {todayPct != null && (
                                        <div
                                            className="absolute top-0 bottom-0 w-px bg-amber-500 z-20"
                                            style={{ left: `${todayPct}%` }}
                                            title="Today"
                                        />
                                    )}

                                    {mvpTargetPct != null && (
                                        <div
                                            className="absolute top-0 bottom-0 w-0 z-10 border-l-2 border-dashed border-violet-500 opacity-90"
                                            style={{ left: `${mvpTargetPct}%` }}
                                            title="MVP Standard feature-complete target"
                                        />
                                    )}

                                    <div className="relative z-[5] py-2 px-1 space-y-1.5">
                                        {bars.map((bar) => {
                                            const layout = barLayout(bar.start, bar.end, { start, totalMs })
                                            if (!layout) return null
                                            const styles = barStatusStyles[bar.status]
                                            return (
                                                <div
                                                    key={bar.id}
                                                    className="relative h-7"
                                                    title={`${bar.label}: ${bar.start} → ${bar.end}`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 h-6 rounded-md shadow-sm ring-1 ${styles.bar} ${styles.ring} flex items-center px-2 min-w-0`}
                                                        style={{
                                                            left: `${layout.leftPct}%`,
                                                            width: `${layout.widthPct}%`,
                                                        }}
                                                    >
                                                        <span className="truncate text-[11px] font-medium text-white drop-shadow-sm">
                                                            {bar.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Commercial tier milestones</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.tierMilestones.map((m) => (
                        <div
                            key={`${m.tier}-${m.label}`}
                            className={`rounded-lg border px-4 py-3 ${
                                m.kind === 'target'
                                    ? 'border-violet-200 bg-violet-50/60'
                                    : m.kind === 'planned_launch'
                                      ? 'border-emerald-200 bg-emerald-50/40'
                                      : 'border-slate-200 bg-slate-50/50'
                            }`}
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {m.tier} · {m.release}
                            </p>
                            <p className="text-sm font-medium text-slate-900 mt-1">{m.label}</p>
                            <p className="text-sm text-slate-600 mt-2 tabular-nums">
                                {formatDisplayDate(m.date)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-2">Progress from git</p>
                <ul className="list-disc pl-5 space-y-1">
                    {data.bars
                        .filter((b) => b.lastProgressCommitIso)
                        .map((b) => (
                            <li key={b.id}>
                                <span className="font-medium text-slate-800">{b.label}</span>
                                {' — last commit on tracked paths: '}
                                <span className="tabular-nums">{formatDisplayDate(b.lastProgressCommitIso)}</span>
                            </li>
                        ))}
                    {data.bars.every((b) => !b.lastProgressCommitIso) && (
                        <li>Run <code className="rounded bg-white px-1 py-0.5 text-xs">npm run roadmap:sync-git</code> from{' '}
                            <code className="rounded bg-white px-1 py-0.5 text-xs">frontend/</code> after commits to populate timestamps.</li>
                    )}
                </ul>
            </div>
        </div>
    )
}
