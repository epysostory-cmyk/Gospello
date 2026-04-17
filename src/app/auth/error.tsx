'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Auth page error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal nav */}
      <div className="px-5 pt-8 pb-4 border-b border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#7C3AED]">
            <span className="text-white font-black text-base">G</span>
          </div>
          <span className="text-xl font-black text-gray-900">Gospello</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          This page couldn&apos;t load correctly. Try again or go back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
