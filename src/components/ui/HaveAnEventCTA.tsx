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
    <div className="mt-12 mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-8 py-8 text-center max-w-xl mx-auto">
      <p className="text-sm font-semibold text-gray-900 mb-1">Running a gospel event?</p>
      <p className="text-sm text-gray-500 mb-4">List it free and reach thousands of believers across Nigeria.</p>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
      >
        Post Your Event — It&apos;s Free →
      </button>
    </div>
  )
}
