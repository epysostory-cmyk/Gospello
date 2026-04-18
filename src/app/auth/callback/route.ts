import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function needsProfileCompletion(
  profile: { profile_completed?: boolean | null } | null
): boolean {
  return !profile?.profile_completed
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (errorParam || errorCode) {
    const isExpired =
      errorCode === 'otp_expired' ||
      errorParam === 'access_denied' ||
      (searchParams.get('error_description') ?? '').toLowerCase().includes('expired')
    return NextResponse.redirect(`${origin}/${isExpired ? 'auth/link-expired' : 'auth/login?error=auth_callback_failed'}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const isExpired = error.message?.toLowerCase().includes('expired') || error.code === 'otp_expired'
      return NextResponse.redirect(`${origin}/${isExpired ? 'auth/link-expired' : 'auth/login?error=auth_callback_failed'}`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed, account_type, display_name')
        .eq('id', user.id)
        .maybeSingle()

      if (needsProfileCompletion(profile)) {
        return NextResponse.redirect(`${origin}/onboarding/complete-profile`)
      }

      if (profile?.account_type === 'church') {
        const { data: church } = await supabase
          .from('churches')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()
        if (!church) return NextResponse.redirect(`${origin}/dashboard/church/setup`)
      }

    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
