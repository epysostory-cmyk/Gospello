'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Menu, X, Shield, LayoutDashboard, Calendar, Building2,
  Users, Star, Tag, BarChart2, Lock, Settings, ExternalLink, LogOut, Bell,
} from 'lucide-react'

interface Props { adminUser: { email: string; role: string }; pendingCount: number }

const NAV = [
  { href: '/admin',              label: 'Dashboard',        icon: LayoutDashboard, exact: true, roles: ['super_admin','admin','moderator'] },
  { href: '/admin/events',        label: 'Events',           icon: Calendar,        badge: true,  roles: ['super_admin','admin','moderator'] },
  { href: '/admin/organizations', label: 'Orgs & Churches',  icon: Building2,                    roles: ['super_admin','admin'] },
  { href: '/admin/users',         label: 'Users',            icon: Users,                        roles: ['super_admin','admin'] },
  { href: '/admin/featured',      label: 'Featured',         icon: Star,                         roles: ['super_admin','admin'] },
  { href: '/admin/categories',    label: 'Categories',       icon: Tag,                          roles: ['super_admin'] },
  { href: '/admin/moderation',    label: 'Moderation',       icon: Shield,                       roles: ['super_admin','admin','moderator'] },
  { href: '/admin/analytics',     label: 'Analytics',        icon: BarChart2,                    roles: ['super_admin','admin'] },
  { href: '/admin/team',          label: 'Admin Mgmt',       icon: Lock,                         roles: ['super_admin'] },
  { href: '/admin/settings',      label: 'Settings',         icon: Settings,                     roles: ['super_admin'] },
]

export default function AdminMobileNav({ adminUser, pendingCount }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  const visibleNav = NAV.filter((item) => item.roles.includes(adminUser.role))

  return (
    <div className="lg:hidden" style={{ background: '#1A1A2E' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Link href="/admin/events?status=pending" className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-b border-white/10 px-3 py-3 space-y-0.5" style={{ background: '#1A1A2E' }}>
          {visibleNav.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'text-yellow-400 bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-yellow-400' : ''}`} />
                  {label}
                </span>
                {badge && pendingCount > 0 && (
                  <span className="text-xs font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="border-t border-white/10 pt-2 mt-2 space-y-0.5">
            <Link href="/" target="_blank" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-white">
              <ExternalLink className="w-4 h-4" /> View Site
            </Link>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 w-full">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
