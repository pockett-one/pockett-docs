import type { PricingModel } from '@/lib/billing/pricing-model'

export type BillingCatalogPlan = {
    id: string
    name: string
    description: string | null
    priceLabel: string
    isRecurring: boolean
    pricingModel: PricingModel
    isRecommended: boolean
}
