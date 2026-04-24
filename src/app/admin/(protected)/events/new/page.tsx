export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminEventForm from './AdminEventForm'

export default async function AdminNewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const { data: adminUser } = await adminClient.from('admin_users').select('role').eq('id', user.id).single()
  if (!adminUser) redirect('/admin/login')

  const canCreate = ['super_admin','admin','moderator'].includes(adminUser.role)
  if (!canCreate) redirect('/404')

  // Fetch only admin-created profiles for the selector
  const [churchRes, seedOrgRes] = await Promise.all([
    adminClient.from('churches').select('id, name, city, state, logo_url').eq('is_hidden', false).eq('created_by_admin', true).order('name'),
    adminClient.from('seeded_organizers').select('id, name, city, state, logo_url').eq('is_hidden', false).order('name'),
  ])

  type ProfileOption = { id: string; name: string; city: string; state: string; logo_url: string|null; profileType: 'church'|'seeded_org' }

  const allProfiles: ProfileOption[] = [
    ...(churchRes.data ?? []).map(c => ({ id: c.id, name: c.name, city: c.city, state: c.state, logo_url: c.logo_url, profileType: 'church' as const })),
    ...(seedOrgRes.data ?? []).map(o => ({ id: o.id, name: o.name, city: o.city, state: o.state, logo_url: o.logo_url, profileType: 'seeded_org' as const })),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return <AdminEventForm adminId={user.id} profiles={allProfiles} />
}
