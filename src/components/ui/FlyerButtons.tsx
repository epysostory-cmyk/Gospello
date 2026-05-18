'use client'

import { useState } from 'react'
import { Download, ExternalLink, Check, Loader2 } from 'lucide-react'

interface Props {
  slug: string
  eventTitle: string
}

export default function FlyerButtons({ slug, eventTitle }: Props) {
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')

  const flyerUrl = `/api/events/${slug}/flyer?format=square`
  const fileName = `${eventTitle.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'event-flyer'}.png`

  async function handleSave() {
    setDlState('loading')
    try {
      const res = await fetch(flyerUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDlState('done')
      setTimeout(() => setDlState('idle'), 2500)
    } catch {
      window.open(flyerUrl, '_blank', 'noopener,noreferrer')
      setDlState('idle')
    }
  }

  return (
    <div className="flex gap-2">
      <a
        href={flyerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-medium py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
      >
        <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
        View Flyer
      </a>
      <button
        onClick={handleSave}
        disabled={dlState === 'loading'}
        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-medium py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm disabled:opacity-60"
      >
        {dlState === 'loading' ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
        ) : dlState === 'done' ? (
          <><Check className="w-3.5 h-3.5 text-emerald-500" /> Saved!</>
        ) : (
          <><Download className="w-3.5 h-3.5 text-indigo-500" /> Save Flyer</>
        )}
      </button>
    </div>
  )
}
