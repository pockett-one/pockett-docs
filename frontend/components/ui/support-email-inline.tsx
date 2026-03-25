'use client'

import { EmailInline } from '@/components/ui/email-inline'
 
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_EMAIL?.trim() || 'support@firmaone.com'
 
 export function SupportEmailInline({
     className,
     label = SUPPORT_EMAIL,
     showExternalIcon = false,
 }: {
     className?: string
     /** Link text (defaults to the email address). */
     label?: string
     /** Adds a small diagonal external icon after the email. */
     showExternalIcon?: boolean
 }) {
    return <EmailInline email={SUPPORT_EMAIL} label={label} showExternalIcon={showExternalIcon} className={className} />
 }
 
