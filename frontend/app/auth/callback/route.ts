import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('Auth callback triggered with code:', !!code, 'error:', error)
  console.log('Full URL:', requestUrl.toString())
  console.log('Config appUrl:', config.appUrl)

  // Use config.appUrl instead of requestUrl.origin to ensure production URL
  const redirectUrl = `${config.appUrl}/dash/connectors`
  console.log('Redirecting to:', redirectUrl)
  return NextResponse.redirect(redirectUrl)
}
