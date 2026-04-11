'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Search, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(!!adminData)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .single()
        setIsAdmin(!!adminData)
      } else {
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Gospello</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/events" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
              Events
            </Link>
            <Link href="/churches" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
              Churches
            </Link>
            <Link href="/churches" className="text-gray-600 hover:text-indigo-600 font-medium text-sm transition-colors">
              Churches
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/events" className="text-gray-600 hover:text-gray-900">
              <Search className="w-5 h-5" />
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Post an Event
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/events" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Events</Link>
          <Link href="/churches" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Churches</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="block text-indigo-600 font-medium py-2" onClick={() => setMenuOpen(false)}>
                  🛡️ Admin Panel
                </Link>
              )}
              <Link href="/dashboard" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleSignOut} className="block text-gray-500 py-2 w-full text-left">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className="block bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Post an Event</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
