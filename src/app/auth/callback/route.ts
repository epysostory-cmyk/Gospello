import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function needsProfileCompletion(
  profile: { profile_completed?: boolean | null; account_type?: string | null; display_name?: string | null } | null
): boolean {
  if (!profile) return true
  if (profile.profile_completed) return false
  if (!profile.account_type) return true
  const name = profile.display_name?.trim() ?? ''
  if (name.length < 3) return true
  if (/^[0-9._@+\-]+$/.test(name)) return true
  return false
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed, account_type, display_name')
          .eq('id', user.id)
          .maybeSingle()

        // Google OAuth users who haven't set account type yet
        if (needsProfileCompletion(profile)) {
          return NextResponse.redirect(`${origin}/onboarding/complete-profile`)
        }

        // Church accounts without a church profile → go to setup first
        if (profile?.account_type === 'church') {
          const { data: church } = await supabase
            .from('churches')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle()

          if (!church) {
            return NextResponse.redirect(`${origin}/dashboard/church/setup`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
