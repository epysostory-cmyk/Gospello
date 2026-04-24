'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, Building2, Mic2, Grid3X3,
  Bell, History, User, Shield, Star, Settings, ExternalLink, LogOut,
  ChevronRight, Tag,
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
      label: 'OVERVIEW',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['super_admin','admin','moderator'] },
      ],
    },
    {
      label: 'CONTENT',
      items: [
        { href: '/admin/events',        label: 'Events',      icon: Calendar,   roles: ['super_admin','admin','moderator'] },
        { href: '/admin/profiles',      label: 'Profiles',    icon: Users,      roles: ['super_admin','admin','moderator'] },
        { href: '/admin/organizations', label: 'Churches',    icon: Building2,  roles: ['super_admin','admin'] },
        { href: '/admin/organizers',    label: 'Organizers',  icon: Mic2,       roles: ['super_admin','admin'] },
        { href: '/admin/categories',    label: 'Categories',  icon: Grid3X3,    roles: ['super_admin'] },
      ],
    },
    {
      label: 'CLAIMS',
      items: [
        { href: '/admin/claims',        label: 'Pending Claims', icon: Bell,    badge: 'claims' as const, roles: ['super_admin','admin'] },
        { href: '/admin/claims/history',label: 'Claim History',  icon: History,                    roles: ['super_admin','admin'] },
      ],
    },
    {
      label: 'MODERATION',
      items: [
        { href: '/admin/moderation',    label: 'Event Queue', icon: Tag,        badge: 'pending' as const, roles: ['super_admin','admin','moderator'] },
      ],
    },
    {
      label: 'COMMUNITY',
      items: [
        { href: '/admin/users',         label: 'Users',       icon: User,       roles: ['super_admin','admin'] },
        { href: '/admin/team',          label: 'Roles',       icon: Shield,     roles: ['super_admin'] },
      ],
    },
    {
      label: 'PLATFORM',
      items: [
        { href: '/admin/featured',      label: 'Featured Events', icon: Star,   roles: ['super_admin','admin'] },
        { href: '/admin/settings',      label: 'Settings',        icon: Settings, roles: ['super_admin'] },
      ],
    },
  ].map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(role)),
  })).filter(section => section.items.length > 0)
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-red-500/20 text-red-400',
  admin:       'bg-violet-500/20 text-violet-400',
  moderator:   'bg-amber-500/20 text-amber-400',
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
  const initial = adminUser.email[0]?.toUpperCase() ?? 'A'

  function getBadgeCount(badge?: 'pending' | 'claims') {
    if (badge === 'pending') return pendingCount
    if (badge === 'claims')  return pendingClaimsCount
    return 0
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-60 min-h-screen sticky top-0 flex-shrink-0"
      style={{ background: '#0F0F0F', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <Link href="/admin" className="flex items-center gap-2 group">
          <span className="text-white font-black text-xl tracking-tight">Gospello</span>
        </Link>
        <p className="text-xs text-gray-600 mt-0.5 font-medium">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
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
                    className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      active
                        ? 'text-white bg-[#1F1F1F]'
                        : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F1F1F]'
                    }`}
                  >
                    {/* Active left border */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#7C3AED] rounded-r-full" />
                    )}
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#7C3AED]' : ''}`} />
                      {label}
                    </span>
                    {badge && count > 0 ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C3AED] text-white min-w-[18px] text-center">
                        {count > 99 ? '99+' : count}
                      </span>
                    ) : active ? (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-1">
        {/* Admin user */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1F1F1F] border border-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white font-medium truncate">{adminUser.email}</p>
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE[adminUser.role] ?? 'bg-gray-500/20 text-gray-400'}`}>
              {ROLE_LABEL[adminUser.role] ?? adminUser.role}
            </span>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#9CA3AF] hover:bg-[#1F1F1F] hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Site
        </Link>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#9CA3AF] hover:bg-[#1F1F1F] hover:text-white transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
