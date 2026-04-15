'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Plus, User, Building2 } from 'lucide-react'

const NAV_ITEMS = {
  default: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'My Events', icon: Calendar },
    { href: '/dashboard/events/new', label: 'Post Event', icon: Plus },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ],
  church: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/church', label: 'Church', icon: Building2 },
    { href: '/dashboard/events', label: 'My Events', icon: Calendar },
    { href: '/dashboard/events/new', label: 'Post Event', icon: Plus },
    { href: '/dashboard/profile', label: 'Account', icon: User },
  ],
}

const HIDDEN_ON = ['/dashboard/events/new', '/edit']

export default function DashboardBottomNav({ isChurch }: { isChurch: boolean }) {
  const pathname = usePathname()

  if (HIDDEN_ON.some((path) => pathname.includes(path))) return null

  const navItems = isChurch ? NAV_ITEMS.church : NAV_ITEMS.default

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-500 hover:text-indigo-600 active:bg-indigo-50 transition-colors min-h-[56px]"
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
