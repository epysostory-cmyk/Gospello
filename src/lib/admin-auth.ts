import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function requireAdminRole(allowedRoles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: adminUser } = await createAdminClient()
    .from('admin_users')
    .select('id, role, email')
    .eq('id', user.id)
    .single()

  if (!adminUser) redirect('/admin/login')
  if (!allowedRoles.includes(adminUser.role)) redirect('/admin')

  return adminUser
}
