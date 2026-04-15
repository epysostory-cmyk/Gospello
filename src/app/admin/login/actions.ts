'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function adminLogin(_prev: { error: string } | null, formData: FormData) {
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

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient
    .from('admin_users')
    .select('id, role')
    .eq('id', data.user.id)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    return { error: 'You do not have admin access.' }
  }

  // Session cookie is now set server-side — redirect is safe
  redirect('/admin')
}
