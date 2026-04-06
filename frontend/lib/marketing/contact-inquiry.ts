/**
 * Contact form deep-link: `/contact?inquiry=sales` pre-selects Inquiry Type "Sales & Licensing"
 * (see `app/(marketing)/contact/page.tsx`).
 */
export const CONTACT_INQUIRY_QUERY_KEY = "inquiry" as const

/** Maps to the exact `INQUIRY_TYPES` label "Sales & Licensing". */
export const CONTACT_INQUIRY_SALES_VALUE = "sales" as const

/** Must match `INQUIRY_TYPES` on the contact form exactly (deep-link target). */
export const CONTACT_INQUIRY_SALES_LABEL = "Sales & Licensing" as const

export const CONTACT_HREF_SALES_INQUIRY = `/contact?${CONTACT_INQUIRY_QUERY_KEY}=${CONTACT_INQUIRY_SALES_VALUE}` as const
