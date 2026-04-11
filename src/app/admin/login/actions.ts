'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !data.user) {
    return { error: 'Invalid email or password' }
  }

  // Check admin status using service role client (bypasses RLS)
  try {
    const adminClient = createAdminClient()
    const { data: adminUser } = await adminClient
      .from('admin_users')
      .select('id, role')
      .eq('id', data.user.id)
      .single()

    if (!adminUser) {
      await supabase.auth.signOut()
      return { error: 'You do not have admin access. Please use the regular sign in page.' }
    }
  } catch {
    await supabase.auth.signOut()
    return { error: 'Admin verification failed. Please try again.' }
  }

  // Return success — let the CLIENT do window.location.href so cookies are
  // fully written to the browser before the next navigation begins.
  return { success: true }
}
