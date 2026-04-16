'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  bannerUrl: string
  eventTitle: string
}

export default function DownloadFlyerButton({ bannerUrl, eventTitle }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleDownload = async () => {
    setState('loading')
    try {
      const response = await fetch(bannerUrl, { mode: 'cors' })
      const blob = await response.blob()
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
      const safeTitle = eventTitle.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()
      const filename = `${safeTitle || 'event-flyer'}.${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      // CORS fallback: open raw image in new tab
      window.open(bannerUrl, '_blank', 'noopener,noreferrer')
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state === 'loading'}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-gray-100 bg-white text-gray-700 hover:bg-gray-50 hover:border-indigo-200 text-sm font-semibold transition-all shadow-sm disabled:opacity-60 group"
    >
      {state === 'loading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Saving flyer...
        </>
      ) : state === 'done' ? (
        <>
          <span className="text-emerald-500">✓</span>
          Saved!
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
          Save Flyer
        </>
      )}
    </button>
  )
}
