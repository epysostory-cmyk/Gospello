'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Search, Shield, ChevronRight, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Events',      href: '/events' },
  { label: 'Churches',    href: '/churches' },
  { label: 'Organizers',  href: '/organizers' },
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
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    // POST to server-side sign out — clears the auth cookie properly
    // Client-only signOut() leaves the server cookie alive causing stale sessions
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100'
            : 'bg-white/95 backdrop-blur-md border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
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
                  <div className="w-8 h-8 bg-indigo-600 group-hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors shadow-sm shadow-indigo-200">
                    <span className="text-white font-black text-sm">G</span>
                  </div>
                  <span className="text-lg font-black text-gray-900 tracking-tight">{siteName}</span>
                </>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors group ${
                      active
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                    {/* Active underline */}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/events" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" aria-label="Search events">
                <Search className="w-4.5 h-4.5 w-5 h-5" />
              </Link>
              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" /> Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="text-sm font-semibold text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="text-sm font-semibold text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm shadow-indigo-200"
                  >
                    Post an Event
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile: Post an Event + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              {!user && (
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
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

      {/* Mobile menu — full-width dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-white border-b border-gray-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            {/* Nav links */}
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                  <ChevronRight className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-gray-300'}`} />
                </Link>
              )
            })}

            <div className="border-t border-gray-100 my-2 pt-2 space-y-1">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50"
                    >
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                  <Link
                    href="/dashboard/events/new"
                    className="flex items-center justify-center gap-2 mt-2 bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-xl"
                  >
                    + Create Event
                  </Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 min-h-[52px]"
                  >
                    {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Sign in <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-xl"
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
