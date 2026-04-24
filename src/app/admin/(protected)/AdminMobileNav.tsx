'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Menu, X, LayoutDashboard, Calendar, Users, Building2, Mic2, Grid3X3,
  Bell, History, User, Shield, Star, Settings, ExternalLink, LogOut, Tag,
} from 'lucide-react'

interface Props { adminUser: { email: string; role: string }; pendingCount: number; pendingClaimsCount?: number }

type NavItem = {
  href: string; label: string; icon: React.ElementType
  exact?: boolean; badge?: 'pending' | 'claims'; roles: string[]
}

const ALL_NAV: NavItem[] = [
  { href: '/admin',              label: 'Dashboard',       icon: LayoutDashboard, exact: true, roles: ['super_admin','admin','moderator'] },
  { href: '/admin/events',       label: 'Events',          icon: Calendar,                     roles: ['super_admin','admin','moderator'] },
  { href: '/admin/profiles',     label: 'Seeded Profiles', icon: Users,                        roles: ['super_admin','admin','moderator'] },
  { href: '/admin/organizations',label: 'User Profiles',   icon: Building2,                    roles: ['super_admin','admin'] },
  { href: '/admin/organizers',   label: 'Organizers',      icon: Mic2,                         roles: ['super_admin','admin'] },
  { href: '/admin/categories',   label: 'Categories',      icon: Grid3X3,                      roles: ['super_admin'] },
  { href: '/admin/claims',       label: 'Pending Claims',  icon: Bell,   badge: 'claims',      roles: ['super_admin','admin'] },
  { href: '/admin/claims/history',label:'Claim History',   icon: History,                      roles: ['super_admin','admin'] },
  { href: '/admin/moderation',   label: 'Event Queue',     icon: Tag,    badge: 'pending',     roles: ['super_admin','admin','moderator'] },
  { href: '/admin/users',        label: 'Users',           icon: User,                         roles: ['super_admin','admin'] },
  { href: '/admin/team',         label: 'Roles',           icon: Shield,                       roles: ['super_admin'] },
  { href: '/admin/featured',     label: 'Featured Events', icon: Star,                         roles: ['super_admin','admin'] },
  { href: '/admin/settings',     label: 'Settings',        icon: Settings,                     roles: ['super_admin'] },
]

export default function AdminMobileNav({ adminUser, pendingCount, pendingClaimsCount = 0 }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  const visibleNav = ALL_NAV.filter((item) => item.roles.includes(adminUser.role))

  function getBadgeCount(badge?: 'pending' | 'claims') {
    if (badge === 'pending') return pendingCount
    if (badge === 'claims')  return pendingClaimsCount
    return 0
  }

  return (
    <div className="lg:hidden" style={{ background: '#0F0F0F' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-black text-base tracking-tight">Gospello</span>
        <div className="flex items-center gap-3">
          {(pendingCount > 0 || pendingClaimsCount > 0) && (
            <Link href="/admin/moderation" className="relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7C3AED] text-white text-xs font-bold rounded-full flex items-center justify-center">
                {(pendingCount + pendingClaimsCount) > 9 ? '9+' : pendingCount + pendingClaimsCount}
              </span>
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-b border-white/10 px-3 py-3 space-y-0.5" style={{ background: '#0F0F0F' }}>
          {visibleNav.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = isActive(href, exact)
            const count  = getBadgeCount(badge)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-white bg-[#1F1F1F]' : 'text-[#9CA3AF] hover:bg-[#1F1F1F] hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7C3AED] rounded-r-full" />
                )}
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#7C3AED]' : ''}`} />
                  {label}
                </span>
                {badge && count > 0 && (
                  <span className="text-xs font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="border-t border-white/10 pt-2 mt-2 space-y-0.5">
            <Link href="/" target="_blank" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:bg-[#1F1F1F] hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" /> View Site
            </Link>
            <form action="/auth/signout" method="POST">
              <button type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#9CA3AF] hover:bg-[#1F1F1F] hover:text-white transition-colors w-full">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
