'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePostEventFAB() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const nearBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 500
      setShow(scrolled > 280 && !nearBottom)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 sm:hidden">
      <Link
        href="/events/new"
        className="block px-5 py-3 bg-gray-950 text-white text-[13px] font-bold rounded-2xl shadow-xl active:scale-95 transition-transform tracking-tight"
      >
        Post event
      </Link>
    </div>
  )
}
