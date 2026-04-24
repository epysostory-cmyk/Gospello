'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  compact?: boolean
}

export default function HaveAnEventCTA({ compact = false }: Props) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleClick = () => {
    if (userId) {
      router.push('/dashboard/events/new')
    } else {
      router.push('/auth/signup?redirect=/dashboard/events/new')
    }
  }

  if (compact) {
    return (
      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-white/70 text-xs mb-2">Loved this event? Host your own on Gospello</p>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors border border-white/20"
        >
          ✨ Create Your Own Event
        </button>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="px-4 sm:px-6 lg:px-8 my-12"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-10 sm:px-10 sm:py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #4F1787 0%, #6D28D9 50%, #7C3AED 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />

        <div className="relative">
          {/* Label pill */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-5">
            🎵 For Churches &amp; Organizers
          </div>

          {/* Heading */}
          <h2 className="text-white text-[28px] sm:text-[32px] font-bold leading-tight mb-3">
            Have an event coming up?
          </h2>

          {/* Subtext */}
          <p className="text-white/85 text-[15px] leading-relaxed max-w-sm mx-auto mb-8">
            Create your own event on Gospello and reach believers across Nigeria.{' '}
            <span className="font-semibold">Free to post.</span>
          </p>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="cta-glow inline-flex items-center gap-2 bg-white text-purple-700 font-semibold text-base px-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-[#F5F3FF] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
            style={{ height: 52 }}
          >
            ✨ Create Your Own Event
          </button>

          {/* Fine print */}
          <p className="text-white/70 text-xs mt-4">Free to post · Free forever</p>
        </div>
      </div>
    </div>
  )
}
