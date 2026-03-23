/** Build in-app Polar checkout URL (GET /api/checkout). Product IDs are Polar catalog product UUIDs. */
export function buildPolarCheckoutHref(params: {
    firmId: string
    returnTo: string
    productId: string
}): string {
    const q = new URLSearchParams()
    q.set('firmId', params.firmId)
    q.set('returnTo', params.returnTo)
    q.append('products', params.productId)
    return `/api/checkout?${q.toString()}`
}
