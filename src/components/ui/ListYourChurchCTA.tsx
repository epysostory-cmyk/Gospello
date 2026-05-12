'use client'

import Link from 'next/link'

export default function ListYourChurchCTA() {
  return (
    <div className="mt-16 mb-8 mx-auto max-w-2xl">
      <div
        className="rounded-3xl px-8 py-10 text-center"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #3b0764 50%, #4c1d95 100%)' }}
      >
        <div className="text-4xl mb-3">⛪</div>
        <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">
          Is your church on Gospello?
        </h3>
        <p className="text-purple-200 text-sm sm:text-base mb-6 max-w-md mx-auto">
          Get your church in front of thousands looking for a place to worship. Free to list — takes 2 minutes.
        </p>
        <Link
          href="/auth/signup?redirect=/dashboard/church/setup"
          className="inline-flex items-center gap-2 bg-white text-purple-900 font-bold px-7 py-3.5 rounded-2xl text-sm sm:text-base hover:bg-purple-50 transition-colors"
        >
          List Your Church — It&apos;s Free →
        </Link>
        <p className="mt-4 text-purple-400 text-xs">
          Already listed? <Link href="/auth/login" className="text-purple-200 underline underline-offset-2">Sign in to manage your profile</Link>
        </p>
      </div>
    </div>
  )
}
