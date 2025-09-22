import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('Auth callback triggered with code:', !!code, 'error:', error)
  console.log('Full URL:', requestUrl.toString())

  // Simple test - just redirect to connectors for now
  const redirectUrl = `${requestUrl.origin}/dash/connectors`
  console.log('Redirecting to:', redirectUrl)
  return NextResponse.redirect(redirectUrl)
}
