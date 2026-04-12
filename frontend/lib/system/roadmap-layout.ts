import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'

export type RoadmapBarStatus = 'done' | 'in_progress' | 'planned'

export type RoadmapJson = {
    schemaVersion: number
    meta: {
        title: string
        subtitle: string
        mvpStandardFeaturesCompleteTarget: string
        notes?: string
    }
    git: {
        recordedAt: string | null
        branch: string | null
        headShort: string | null
        dataFileLastCommitIso: string | null
    }
    timeline: { rangeStart: string; rangeEnd: string }
    tracks: { id: string; label: string; order: number }[]
    bars: {
        id: string
        trackId: string
        label: string
        start: string
        end: string
        status: RoadmapBarStatus
        gitPaths?: string[]
        lastProgressCommitIso?: string
    }[]
    tierMilestones: {
        tier: string
        release: string
        label: string
        date: string
        kind: 'target' | 'planned_launch' | 'planned'
    }[]
}

function parseDate(s: string): Date | null {
    const d = parseISO(s)
    return isValid(d) ? d : null
}

export function roadmapTimelineMs(rangeStart: string, rangeEnd: string): { start: Date; end: Date; totalMs: number } | null {
    const start = parseDate(rangeStart)
    const end = parseDate(rangeEnd)
    if (!start || !end || end <= start) return null
    return { start, end, totalMs: end.getTime() - start.getTime() }
}

/** 0–100 position of instant `d` on the timeline, clamped. */
export function percentOnTimeline(d: Date, start: Date, totalMs: number): number {
    const p = ((d.getTime() - start.getTime()) / totalMs) * 100
    return Math.min(100, Math.max(0, p))
}

export function barLayout(
    barStart: string,
    barEnd: string,
    timeline: { start: Date; totalMs: number }
): { leftPct: number; widthPct: number } | null {
    const a = parseDate(barStart)
    const b = parseDate(barEnd)
    if (!a || !b || b < a) return null
    const leftPct = percentOnTimeline(a, timeline.start, timeline.totalMs)
    const rightPct = percentOnTimeline(b, timeline.start, timeline.totalMs)
    return { leftPct, widthPct: Math.max(0.35, rightPct - leftPct) }
}

export function formatDisplayDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    const d = parseISO(iso)
    if (!isValid(d)) return '—'
    return format(d, 'd MMM yyyy')
}

export function daysUntil(isoDate: string): number | null {
    const d = parseISO(isoDate)
    if (!isValid(d)) return null
    return differenceInCalendarDays(d, new Date())
}

export const barStatusStyles: Record<
    RoadmapBarStatus,
    { bar: string; ring: string }
> = {
    done: {
        bar: 'bg-emerald-500/90',
        ring: 'ring-emerald-600/30',
    },
    in_progress: {
        bar: 'bg-sky-500/90',
        ring: 'ring-sky-600/30',
    },
    planned: {
        bar: 'bg-slate-300/90',
        ring: 'ring-slate-400/25',
    },
}
