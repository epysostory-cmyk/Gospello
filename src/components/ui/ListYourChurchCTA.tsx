'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ListYourChurchCTA() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
  }, [])

  const href = loggedIn ? '/dashboard/church/setup' : '/auth/signup?redirect=/dashboard/church/setup'

  return (
    <div className="mt-16 mb-8 mx-auto max-w-2xl">
      <div className="rounded-2xl px-8 py-10 text-center bg-amber-50 border border-amber-200">
        <div className="text-4xl mb-3">⛪</div>
        <h3 className="text-gray-900 text-xl sm:text-2xl font-bold mb-2">
          Is your church on Gospello?
        </h3>
        <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
          Get your church in front of thousands looking for a place to worship. Free to list — takes 2 minutes.
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-7 py-3.5 rounded-xl text-sm sm:text-base hover:bg-gray-800 transition-colors"
        >
          List Your Church — It&apos;s Free →
        </Link>
        {loggedIn === false && (
          <p className="mt-4 text-gray-400 text-xs">
            Already listed?{' '}
            <Link href="/auth/login" className="text-gray-600 underline underline-offset-2">
              Sign in to manage your profile
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
