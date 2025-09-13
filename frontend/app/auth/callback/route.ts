import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Auth callback triggered with code:', !!code)

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/app/signin?error=auth_error`)
    }
    
    console.log('Successfully exchanged code for session, redirecting to /app/connectors')
  }

  // Always redirect to app connectors page after successful auth
  return NextResponse.redirect(`${requestUrl.origin}/app/connectors`)
}
