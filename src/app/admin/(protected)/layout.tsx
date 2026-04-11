export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, LayoutDashboard, Calendar, Users, Star, LogOut, UserCog } from 'lucide-react'

// Decode the Supabase session cookie without making any network call.
// This prevents createServerClient from firing SIGNED_OUT and clearing cookies.
async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace('https://', '')
    .split('.')[0]
  const key = `sb-${projectRef}-auth-token`

  // Collect value — may be a single cookie or chunked (.0, .1, ...)
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
    // Strip the "base64-" prefix that @supabase/ssr adds
    const b64url = raw.startsWith('base64-') ? raw.slice(7) : raw
    // Convert base64url → base64
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
  // Read user ID from cookie without any Supabase network call
  const userId = await getUserIdFromCookie()
  if (!userId) redirect('/admin/login')

  // Verify admin status via service role client (bypasses RLS)
  const adminClient = createAdminClient()
  const { data: adminUser, error } = await adminClient
    .from('admin_users')
    .select('id, role, email')
    .eq('id', userId)
    .single()

  if (error || !adminUser) redirect('/admin/login')

  const isSuperAdmin = adminUser.role === 'super_admin'

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Event Review', icon: Calendar },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/featured', label: 'Featured', icon: Star },
    ...(isSuperAdmin ? [{ href: '/admin/team', label: 'Admin Team', icon: UserCog }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 py-6 px-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-white font-semibold text-sm">Admin Panel</p>
            <p className="text-xs text-gray-500 capitalize">{adminUser.role.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-800 pt-4 space-y-1">
          <p className="px-3 text-xs text-gray-600 truncate">{adminUser.email}</p>
          <Link
            href="/api/admin/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="md:hidden bg-gray-900 text-gray-300 px-4 py-3">
          <div className="flex gap-4 overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium py-1">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  )
}
