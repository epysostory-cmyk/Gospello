'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  currentType: string
}

export default function ChangeTypeButton({ userId, currentType }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const types = [
    { value: 'organizer', label: '🎤 Organizer' },
    { value: 'church', label: '⛪ Church' },
  ]

  const handleChange = async (newType: string) => {
    if (newType === currentType) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: newType }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        title="Change account type"
        className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Change'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
            {types.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange(value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === currentType
                    ? 'text-indigo-400 bg-indigo-500/10 font-medium'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {label}
                {value === currentType && <span className="ml-1 text-xs text-indigo-500">(current)</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
