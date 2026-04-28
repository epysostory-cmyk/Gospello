'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  compact?: boolean
}

export default function HaveAnEventCTA({ compact = false }: Props) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
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
    <div className="px-4 sm:px-6 lg:px-8 my-10 flex justify-center">
      <button
        onClick={handleClick}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #4F1787 0%, #7C3AED 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
        }}
      >
        <span className="text-lg">✨</span>
        Create Your Own Event
        <span className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150">→</span>
      </button>
    </div>
  )
}
