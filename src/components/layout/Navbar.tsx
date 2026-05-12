'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Shield, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Events',     href: '/events' },
  { label: 'Categories', href: '/categories' },
  { label: 'Churches',   href: '/churches' },
  { label: 'Organizers', href: '/organizers' },
]

interface NavbarProps {
  logoUrl?: string | null
  siteName?: string
}

export default function Navbar({ logoUrl, siteName = 'Gospello' }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: adminData } = await supabase
          .from('admin_users').select('id').eq('id', data.user.id).single()
        setIsAdmin(!!adminData)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admin_users').select('id').eq('id', session.user.id).single()
        setIsAdmin(!!adminData)
      } else {
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15" style={{ height: '60px' }}>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              ) : (
                <>
                  <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="text-base font-bold text-gray-900">{siteName}</span>
                </>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" /> Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Post an Event
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: CTA + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              {!user && (
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                >
                  Post Event
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[60px] z-40 bg-white border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">

            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            <div className="border-t border-gray-100 pt-2 mt-2 space-y-0.5">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50"
                    >
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/events/new"
                    className="flex items-center justify-center gap-2 mt-1 bg-indigo-600 text-white text-sm font-semibold py-3 rounded-lg"
                  >
                    + Create Event
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center bg-indigo-600 text-white text-sm font-semibold py-3 rounded-lg mt-1"
                  >
                    Post an Event →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
