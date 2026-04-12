/** Build in-app Polar checkout URL (GET /api/checkout). Product IDs are Polar catalog product UUIDs. */
export function buildPolarCheckoutHref(params: {
    firmId: string
    returnTo: string
    /** Single product (typical). */
    productId?: string
    /** Multiple Polar product UUIDs (optional; e.g. hosted checkout with several line items). */
    productIds?: string[]
}): string {
    const q = new URLSearchParams()
    q.set('firmId', params.firmId)
    q.set('returnTo', params.returnTo)
    const ids =
        params.productIds?.filter(Boolean) ??
        (params.productId ? [params.productId] : [])
    for (const id of ids) {
        q.append('products', id)
    }
    return `/api/checkout?${q.toString()}`
}
