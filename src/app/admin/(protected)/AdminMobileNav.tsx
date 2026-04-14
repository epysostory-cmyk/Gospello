'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Menu, X, Shield, LayoutDashboard, Calendar, Building2,
  Users, ShieldCheck, Settings2, ExternalLink, LogOut, Bell,
} from 'lucide-react'

interface Props {
  adminUser: { email: string; role: string }
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

export default function AdminMobileNav({ adminUser, pendingCount }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3 border-b border-gray-800">
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
        <div className="bg-gray-900 border-b border-gray-800 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
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
          <div className="border-t border-gray-800 pt-2 mt-2 space-y-0.5">
            <Link href="/" target="_blank" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white">
              <ExternalLink className="w-4 h-4" />View Site
            </Link>
            <Link href="/api/admin/signout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300">
              <LogOut className="w-4 h-4" />Sign out
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
