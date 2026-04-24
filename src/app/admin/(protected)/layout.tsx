export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from './AdminSidebar'
import AdminMobileNav from './AdminMobileNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()
  const [adminUserRes, pendingEventsRes, pendingClaimsRes] = await Promise.all([
    adminClient.from('admin_users').select('id, role, email').eq('id', user.id).single(),
    adminClient.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    adminClient.from('claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  if (!adminUserRes.data) redirect('/admin/login')

  const adminUser = adminUserRes.data
  const pendingCount = pendingEventsRes.count ?? 0
  const pendingClaimsCount = pendingClaimsRes.count ?? 0

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      <AdminSidebar adminUser={adminUser} pendingCount={pendingCount} pendingClaimsCount={pendingClaimsCount} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0" style={{ background: '#F9FAFB' }}>
        <AdminMobileNav adminUser={adminUser} pendingCount={pendingCount} pendingClaimsCount={pendingClaimsCount} />
        <main className="flex-1 overflow-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
