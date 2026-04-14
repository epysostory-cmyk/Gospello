'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield, LayoutDashboard, Calendar, Building2,
  Users, ShieldCheck, Settings2, ExternalLink, LogOut, Bell,
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  role: string
}

interface Props {
  adminUser: AdminUser
  pendingCount: number
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/events', label: 'Events', icon: Calendar, badge: true },
  { href: '/admin/organizations', label: 'Churches & Organizers', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/content', label: 'Content Control', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Settings', icon: Settings2 },
]

export default function AdminSidebar({ adminUser, pendingCount }: Props) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Gospello</p>
          <p className="text-xs text-gray-500 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <Link
          href="/admin/events?status=pending"
          className="mx-4 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors"
        >
          <Bell className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{pendingCount} event{pendingCount !== 1 ? 's' : ''} awaiting review</span>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </span>
              {badge && pendingCount > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-3 space-y-1">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-white font-medium truncate">{adminUser.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{adminUser.role.replace('_', ' ')}</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Site
        </Link>
        <Link
          href="/api/admin/signout"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Link>
      </div>
    </aside>
  )
}
