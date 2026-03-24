export type PricingModel = 'recurring_subscription' | 'one_time_purchase'

export function pricingModelFromRecurringFlag(isRecurring: boolean): PricingModel {
    return isRecurring ? 'recurring_subscription' : 'one_time_purchase'
}
