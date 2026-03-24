/**
 * Client-side: create a Polar customer portal session and return the redirect URL.
 */

export async function openPolarCustomerPortalSession(options: {
    firmId: string
    returnTo?: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    const res = await fetch('/api/billing/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firmId: options.firmId,
            ...(options.returnTo ? { returnTo: options.returnTo } : {}),
        }),
    })
    const data = (await res.json().catch(() => ({}))) as { url?: unknown; error?: unknown }
    if (!res.ok) {
        return {
            ok: false,
            error: typeof data.error === 'string' ? data.error : 'Could not open billing portal.',
        }
    }
    if (typeof data.url === 'string' && data.url.startsWith('http')) {
        return { ok: true, url: data.url }
    }
    return { ok: false, error: 'Could not open billing portal.' }
}
