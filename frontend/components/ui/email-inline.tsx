 'use client'
 
 import { useState } from 'react'
 import Link from 'next/link'
 import { Copy, ExternalLink, Mail } from 'lucide-react'
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
 import { cn } from '@/lib/utils'
 
 export function EmailInline({
     email,
     className,
     label,
     showExternalIcon = false,
 }: {
     email: string
     className?: string
     /** Link text (defaults to the email address). */
     label?: string
     /** Adds a small diagonal external icon after the email. */
     showExternalIcon?: boolean
 }) {
     const normalizedEmail = email.trim()
     const [copied, setCopied] = useState(false)
 
     const copy = async () => {
         try {
             await navigator.clipboard.writeText(normalizedEmail)
             setCopied(true)
             window.setTimeout(() => setCopied(false), 1200)
         } catch {
             // Best-effort fallback.
             try {
                 const ta = document.createElement('textarea')
                 ta.value = normalizedEmail
                 ta.style.position = 'fixed'
                 ta.style.left = '-9999px'
                 document.body.appendChild(ta)
                 ta.focus()
                 ta.select()
                 document.execCommand('copy')
                 document.body.removeChild(ta)
                 setCopied(true)
                 window.setTimeout(() => setCopied(false), 1200)
             } catch {
                 // ignore
             }
         }
     }
 
     return (
         <span className={cn('inline-flex items-center gap-1.5 align-middle', className)}>
             <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden />
             <Link
                 href={`mailto:${normalizedEmail}`}
                 className="inline-flex items-center gap-1 font-medium text-slate-600 underline decoration-slate-300/80 underline-offset-2 hover:text-slate-900 hover:decoration-slate-400"
             >
                 {label ?? normalizedEmail}
                 {showExternalIcon ? <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden /> : null}
             </Link>
             <TooltipProvider delayDuration={200}>
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <button
                             type="button"
                             onClick={() => void copy()}
                             className={cn(
                                 'inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors',
                                 'hover:bg-slate-100 hover:text-slate-600',
                                 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-1'
                             )}
                             aria-label={`Copy ${normalizedEmail}`}
                         >
                             <Copy className="h-3.5 w-3.5" aria-hidden />
                         </button>
                     </TooltipTrigger>
                     <TooltipContent variant="light" side="top" align="start">
                         {copied ? 'Copied' : 'Copy email'}
                     </TooltipContent>
                 </Tooltip>
             </TooltipProvider>
         </span>
     )
 }
 
