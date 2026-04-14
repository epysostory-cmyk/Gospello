export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSidebar from './AdminSidebar'
import AdminMobileNav from './AdminMobileNav'

async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace('https://', '')
    .split('.')[0]
  const key = `sb-${projectRef}-auth-token`

  let raw = cookieStore.get(key)?.value ?? null
  if (!raw) {
    const chunks: string[] = []
    for (let i = 0; i < 10; i++) {
      const chunk = cookieStore.get(`${key}.${i}`)?.value
      if (!chunk) break
      chunks.push(chunk)
    }
    if (chunks.length > 0) raw = chunks.join('')
  }
  if (!raw) return null

  try {
    const b64url = raw.startsWith('base64-') ? raw.slice(7) : raw
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf-8')
    const session = JSON.parse(json)
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userId = await getUserIdFromCookie()
  if (!userId) redirect('/admin/login')

  const adminClient = createAdminClient()
  const [adminUserRes, pendingRes] = await Promise.all([
    adminClient
      .from('admin_users')
      .select('id, role, email')
      .eq('id', userId)
      .single(),
    adminClient
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  if (!adminUserRes.data) redirect('/admin/login')

  const adminUser = adminUserRes.data
  const pendingCount = pendingRes.count ?? 0

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar adminUser={adminUser} pendingCount={pendingCount} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <AdminMobileNav adminUser={adminUser} pendingCount={pendingCount} />
        <main className="flex-1 overflow-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
