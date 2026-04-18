import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Calendar, Plus, User, Building2 } from 'lucide-react'
import SignOutButton from './SignOutButton'
import DashboardBottomNav from './DashboardBottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getSession() reads local cookie (fast, no network call)
  // getUser()    verifies with Supabase server (detects deleted accounts)
  const [{ data: { session } }, { data: { user } }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ])

  if (session && !user) {
    // Broken session — clear it server-side before redirecting
    await supabase.auth.signOut()
    redirect('/auth/login?reason=deleted')
  }
  if (!user) redirect('/auth/login')

  // Block unverified email accounts
  if (!user.email_confirmed_at) redirect('/auth/link-expired')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.profile_completed) {
    redirect('/onboarding/complete-profile')
  }

  const isChurch = profile?.account_type === 'church'

  // Build nav based on account type
  const navItems = isChurch
    ? [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/church', label: 'Church Profile', icon: Building2 },
        { href: '/dashboard/events', label: 'My Events', icon: Calendar },
        { href: '/dashboard/events/new', label: 'Post Event', icon: Plus },
        { href: '/dashboard/profile', label: 'Account', icon: User },
      ]
    : [
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

        <div className="mt-4">
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 pb-24 md:p-8 md:pb-8">{children}</div>
      </div>

      {/* Mobile Bottom Tab Bar — hidden on form pages */}
      <DashboardBottomNav isChurch={isChurch} />
    </div>
  )
}
