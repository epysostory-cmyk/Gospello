'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Shield, LogOut, Loader2, Search, Home, Calendar, Church } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Events',     href: '/events' },
  { label: 'Churches',   href: '/churches' },
  { label: 'Organizers', href: '/organizers' },
]

const BOTTOM_NAV = [
  { label: 'Home',    href: '/',          Icon: Home },
  { label: 'Events',  href: '/events',    Icon: Calendar },
  { label: 'Search',  href: '/search',    Icon: Search },
  { label: 'Churches', href: '/churches', Icon: Church },
]

interface NavbarProps {
  logoUrl?: string | null
  siteName?: string
}

export default function Navbar({ logoUrl, siteName = 'Gospello' }: NavbarProps) {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ,    setSearchQ]    = useState('')
  const [user,       setUser]       = useState<User | null>(null)
  const [isAdmin,    setIsAdmin]    = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase  = createClient()
  const pathname  = usePathname()
  const router    = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [pathname])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: '60px' }}>

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
              {/* Search bar */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <input
                    ref={searchRef}
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search…"
                    className="w-48 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onBlur={() => { if (!searchQ) setSearchOpen(false) }}
                  />
                  <button type="submit" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Search className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                </button>
              )}

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

            {/* Mobile: search + CTA + hamburger */}
            <div className="md:hidden flex items-center gap-1.5">
              <Link
                href="/search"
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Link>
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

      {/* Mobile drawer menu */}
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

      {/* Mobile bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-4">
          {BOTTOM_NAV.map(({ label, href, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

    </>
  )
}
