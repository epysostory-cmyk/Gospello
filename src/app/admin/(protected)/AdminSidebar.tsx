'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Building2, Users, Star,
  Tag, Shield, BarChart2, Lock, Settings, ExternalLink, LogOut, Bell, MessageSquare,
} from 'lucide-react'

interface AdminUser { id: string; email: string; role: string }
interface Props { adminUser: AdminUser; pendingCount: number }

const NAV = [
  { href: '/admin',              label: 'Dashboard',         icon: LayoutDashboard, exact: true, roles: ['super_admin','admin','moderator'] },
  { href: '/admin/events',        label: 'Events',            icon: Calendar,        badge: true,  roles: ['super_admin','admin','moderator'] },
  { href: '/admin/organizations', label: 'Orgs & Churches',   icon: Building2,                    roles: ['super_admin','admin'] },
  { href: '/admin/users',         label: 'Users',             icon: Users,                        roles: ['super_admin','admin'] },
  { href: '/admin/featured',      label: 'Featured Events',   icon: Star,                         roles: ['super_admin','admin'] },
  { href: '/admin/categories',    label: 'Categories',        icon: Tag,                          roles: ['super_admin'] },
  { href: '/admin/moderation',          label: 'Moderation',          icon: Shield,         roles: ['super_admin','admin','moderator'] },
  { href: '/admin/contact-submissions', label: 'Contact Submissions', icon: MessageSquare,  roles: ['super_admin','admin'] },
  { href: '/admin/analytics',           label: 'Analytics',           icon: BarChart2,      roles: ['super_admin','admin'] },
  { href: '/admin/team',                label: 'Admin Management',    icon: Lock,           roles: ['super_admin'] },
  { href: '/admin/settings',            label: 'Settings',            icon: Settings,       roles: ['super_admin'] },
]

export default function AdminSidebar({ adminUser, pendingCount }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const visibleNav = NAV.filter((item) => item.roles.includes(adminUser.role))

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen sticky top-0" style={{ background: '#1A1A2E' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Gospello</p>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <Link
          href="/admin/events?status=pending"
          className="mx-3 mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors"
        >
          <Bell className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{pendingCount} pending review</span>
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'text-yellow-400 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-yellow-400 rounded-r-full" />
              )}
              <span className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-yellow-400' : ''}`} />
                {label}
              </span>
              {badge && pendingCount > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white min-w-[20px] text-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-white font-medium truncate">{adminUser.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{adminUser.role.replace('_', ' ')}</p>
        </div>
        <Link href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
          <ExternalLink className="w-4 h-4" />
          View Site
        </Link>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
