'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addAdminUser(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  if (!email || !role) return { error: 'Email and role required' }

  // Look up auth user by email
  const adminClient = createAdminClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const user = users.find(u => u.email === email)
  if (!user) return { error: 'No user found with that email' }

  const { error } = await adminClient.from('admin_users').insert({ id: user.id, email, role })
  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function deleteAdminUser(userId: string) {
  const adminClient = createAdminClient()
  await adminClient.from('admin_users').delete().eq('id', userId)
  revalidatePath('/admin/team')
}
