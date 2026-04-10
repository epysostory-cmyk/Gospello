import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Calendar, Plus, User, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'My Events', icon: Calendar },
    { href: '/dashboard/events/new', label: 'Post Event', icon: Plus },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 py-6 px-4">
        <div className="mb-8 px-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{profile?.display_name ?? user.email}</p>
          <span className="text-xs text-indigo-600 font-medium capitalize">{profile?.account_type}</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <form action="/auth/signout" method="POST" className="mt-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Link>
        </form>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile top nav */}
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-4 overflow-x-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-gray-600 py-1"
              >
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
