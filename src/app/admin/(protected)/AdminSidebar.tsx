'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, Building2, Mic2, Grid3X3,
  Bell, History, User, Shield, Star, Settings, ExternalLink, LogOut,
  Tag, BarChart2,
} from 'lucide-react'

interface AdminUser { id: string; email: string; role: string }
interface Props { adminUser: AdminUser; pendingCount: number; pendingClaimsCount?: number }

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: 'pending' | 'claims'
  roles: string[]
}

type NavSection = {
  label: string
  items: NavItem[]
}

function buildNav(role: string): NavSection[] {
  return [
    {
      label: 'Overview',
      items: [
        { href: '/admin',            label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['super_admin','admin','moderator'] },
        { href: '/admin/analytics',  label: 'Analytics', icon: BarChart2,                    roles: ['super_admin','admin'] },
      ],
    },
    {
      label: 'Content',
      items: [
        { href: '/admin/events',        label: 'Events',            icon: Calendar,  roles: ['super_admin','admin','moderator'] },
        { href: '/admin/profiles',      label: 'Seeded Churches',   icon: Building2, roles: ['super_admin','admin','moderator'] },
        { href: '/admin/organizations', label: 'User Profiles',     icon: Users,     roles: ['super_admin','admin'] },
        { href: '/admin/organizers',    label: 'Seeded Organizers', icon: Mic2,      roles: ['super_admin','admin'] },
        { href: '/admin/categories',    label: 'Categories',        icon: Grid3X3,   roles: ['super_admin'] },
      ],
    },
    {
      label: 'Claims',
      items: [
        { href: '/admin/claims',         label: 'Pending Claims', icon: Bell,    badge: 'claims' as const, roles: ['super_admin','admin'] },
        { href: '/admin/claims/history', label: 'Claim History',  icon: History,                          roles: ['super_admin','admin'] },
      ],
    },
    {
      label: 'Moderation',
      items: [
        { href: '/admin/moderation', label: 'Event Queue', icon: Tag, badge: 'pending' as const, roles: ['super_admin','admin','moderator'] },
      ],
    },
    {
      label: 'Community',
      items: [
        { href: '/admin/users', label: 'Users', icon: User,   roles: ['super_admin','admin'] },
        { href: '/admin/team',  label: 'Roles', icon: Shield, roles: ['super_admin'] },
      ],
    },
    {
      label: 'Platform',
      items: [
        { href: '/admin/featured',  label: 'Featured Events', icon: Star,     roles: ['super_admin','admin'] },
        { href: '/admin/settings',  label: 'Settings',        icon: Settings, roles: ['super_admin'] },
      ],
    },
  ].map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(role)),
  })).filter(section => section.items.length > 0)
}

const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  super_admin: { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
  admin:       { bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  moderator:   { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400' },
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  moderator:   'Moderator',
}

export default function AdminSidebar({ adminUser, pendingCount, pendingClaimsCount = 0 }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const sections = buildNav(adminUser.role)
  const initial  = adminUser.email[0]?.toUpperCase() ?? 'A'

  function getBadgeCount(badge?: 'pending' | 'claims') {
    if (badge === 'pending') return pendingCount
    if (badge === 'claims')  return pendingClaimsCount
    return 0
  }

  const roleMeta = ROLE_BADGE[adminUser.role]

  return (
    <aside
      className="hidden lg:flex flex-col w-56 h-screen sticky top-0 flex-shrink-0 overflow-y-auto"
      style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm leading-none">G</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Gospello</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.label} className={si > 0 ? 'mt-1 pt-1 border-t border-white/[0.05]' : ''}>
            <p className="px-2 pt-3 pb-1 text-[11px] font-medium text-gray-600">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact, badge }) => {
                const active = isActive(href, exact)
                const count  = getBadgeCount(badge)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center justify-between px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                      active
                        ? 'text-white bg-white/10'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#7C3AED] rounded-r-full" />
                    )}
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-[15px] h-[15px] flex-shrink-0 ${active ? 'text-[#9B6FE8]' : 'text-gray-600'}`} />
                      {label}
                    </span>
                    {badge && count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C3AED] text-white min-w-[18px] text-center leading-none">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-1">
          <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-300 font-medium truncate">{adminUser.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {roleMeta && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleMeta.dot}`} />}
              <span className={`text-[10px] font-medium ${roleMeta?.text ?? 'text-gray-500'}`}>
                {ROLE_LABEL[adminUser.role] ?? adminUser.role}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors"
        >
          <ExternalLink className="w-[15px] h-[15px]" />
          View Site
        </Link>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors w-full text-left"
          >
            <LogOut className="w-[15px] h-[15px]" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
