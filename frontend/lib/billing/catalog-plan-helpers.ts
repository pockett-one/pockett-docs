/**
 * Pure helpers for Polar catalog plans (client + server safe).
 * Grouping must tolerate API shape drift (interval fields, `is_recurring` missing, etc.).
 */

/** Collapse whitespace and strip trailing “(Monthly)” / “(Annual)” style suffixes for grouping. */
export function canonicalPlanGroupKey(name: string): string {
    return name
        .replace(/\u00a0/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*\((?:monthly|annual|yearly|month|year)\)\s*$/i, '')
        .trim()
}

function normalizeLabelForInference(label: string): string {
    return label.replace(/\u00a0/g, ' ').trim().toLowerCase()
}

/**
 * Fallback when Polar `recurring_interval` / structured catalog fields are missing.
 * Prefer API fields in `polar-catalog.ts` (`polarRecurringIntervalFromApi` + `extractStructuredSubscriptionPrice`).
 */
export function inferIntervalFromCatalogPriceLabel(label: string): 'month' | 'year' | null {
    const t = normalizeLabelForInference(label)
    if (!t || t === 'see checkout') return null
    // `/ mo`, `/mo`, `/ month`, `per month`, etc.
    if (/\/\s*(mo|month)\b/i.test(t) || /per\s*month\b/i.test(t) || /\bmonthly\b/.test(t)) return 'month'
    if (/\/\s*(yr|year)\b/i.test(t) || /per\s*year\b/i.test(t) || /\bannual(ly)?\b/.test(t) || /\byearly\b/.test(t)) {
        return 'year'
    }
    return null
}

/**
 * Month vs year tier for **grouping and toggles** — stricter than display-only copy.
 * Uses API `recurringInterval` first, then label heuristics (incl. loose matches Polar may emit).
 */
export function intervalTierForGrouping(plan: {
    recurringInterval: string | null
    priceLabel: string
}): 'month' | 'year' | null {
    if (plan.recurringInterval === 'month' || plan.recurringInterval === 'year') {
        return plan.recurringInterval
    }
    const fromInfer = inferIntervalFromCatalogPriceLabel(plan.priceLabel)
    if (fromInfer) return fromInfer

    const t = normalizeLabelForInference(plan.priceLabel)
    if (!t) return null
    // Loose: “$468 / yr”, “468/yr”, “billed annually”, UI-only strings
    const looksYear =
        /\b(yr|year|annual)\b/.test(t) ||
        /\/\s*yr\b/.test(t) ||
        /\$\s*[\d,.]+\s*\/\s*yr\b/.test(t)
    const looksMonth =
        /\b(mo|month)\b/.test(t) || /\/\s*mo\b/.test(t) || /\$\s*[\d,.]+\s*\/\s*mo\b/.test(t)
    if (looksMonth && !looksYear) return 'month'
    if (looksYear && !looksMonth) return 'year'
    return null
}

export function effectiveCatalogInterval(plan: {
    recurringInterval: string | null
    priceLabel: string
}): 'month' | 'year' | null {
    return intervalTierForGrouping(plan)
}
