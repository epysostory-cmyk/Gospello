'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Footer() {
  const [loggedIn, setLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-xl font-bold text-white">Gospello</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              The central platform for discovering Christian events and churches — helping you find what God is doing around you.
            </p>
            <p className="text-xs text-gray-500 mt-4">Nigeria · Est. 2025</p>
          </div>

          {/* Discover */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-white transition-colors">All Events</Link></li>
              <li><Link href="/events?category=worship" className="hover:text-white transition-colors">Worship</Link></li>
              <li><Link href="/events?category=prayer" className="hover:text-white transition-colors">Prayer</Link></li>
              <li><Link href="/events?category=conference" className="hover:text-white transition-colors">Conferences</Link></li>
              <li><Link href="/churches" className="hover:text-white transition-colors">Churches</Link></li>
            </ul>
          </div>

          {/* Organizers */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Organizers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Post an Event</Link></li>
              <li><Link href="/auth/signup?type=church" className="hover:text-white transition-colors">Register Church</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              {!loggedIn && (
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Gospello. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Connecting believers across Nigeria and beyond.
          </p>
        </div>
      </div>
    </footer>
  )
}
