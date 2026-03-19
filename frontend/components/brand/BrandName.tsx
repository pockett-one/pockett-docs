import { cookies } from 'next/headers'
import { BRAND_NAME, PLATFORM_BRAND_COOKIE } from '@/config/brand'

type BrandNameProps = {
  className?: string
  /** Defaults to false; enable when used in client-hydrated layouts */
  suppressHydrationWarning?: boolean
}

export async function BrandName({ className, suppressHydrationWarning }: BrandNameProps) {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(PLATFORM_BRAND_COOKIE)?.value
  const resolved = (cookieValue || BRAND_NAME).trim() || 'Pockett'

  return (
    <span className={className} suppressHydrationWarning={suppressHydrationWarning}>
      {resolved}
    </span>
  )
}

