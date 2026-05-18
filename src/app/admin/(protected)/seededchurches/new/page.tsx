export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CreateProfileForm from './CreateProfileForm'

export default async function AdminProfilesNewPage() {
  // Verify admin session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.from('admin_users').select('role').eq('id', user.id).single()
  if (!adminUser) redirect('/admin/login')

  // Only admin and super_admin can create profiles; moderator can create but not certain things
  const canCreate = ['super_admin', 'admin', 'moderator'].includes(adminUser.role)
  if (!canCreate) redirect('/404')

  return <CreateProfileForm adminId={user.id} />
}
