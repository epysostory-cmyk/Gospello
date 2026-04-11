import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, LayoutDashboard, Calendar, Users, Star, LogOut } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Temporary: allow any logged-in user to access admin
  const adminUser = { role: 'super_admin' }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Event Review', icon: Calendar },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/featured', label: 'Featured', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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

        <div className="border-t border-gray-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        {/* Mobile nav */}
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
