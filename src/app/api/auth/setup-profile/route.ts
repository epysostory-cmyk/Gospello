import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Called immediately after signUp to guarantee the profiles row exists
 * with the correct account_type and display_name.
 *
 * The Supabase trigger (on_auth_user_created) should handle this, but
 * it can fail silently (e.g. first deploy, trigger not yet applied).
 * This is a belt-and-suspenders fallback using the admin client.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email, accountType, displayName } = await req.json()

    if (!userId || !email || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Upsert: creates the row if trigger missed it, or leaves it untouched if it's already correct
    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          account_type: accountType,
          display_name: displayName || email.split('@')[0],
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )

    if (error) {
      console.error('[setup-profile] upsert error:', error.message)
      // Don't fail the signup — the trigger may have already created it correctly
      return NextResponse.json({ ok: false, error: error.message })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[setup-profile] unexpected error:', err)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
