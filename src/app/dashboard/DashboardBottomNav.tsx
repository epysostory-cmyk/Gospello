'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Pages where the bottom nav should be hidden (they have their own sticky bottom bar)
const HIDDEN_ON = [
  '/dashboard/events/new',
  '/edit',
]

export default function DashboardBottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  // Hide on create/edit form pages
  const isHidden = HIDDEN_ON.some((path) => pathname.includes(path))
  if (isHidden) return null

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
