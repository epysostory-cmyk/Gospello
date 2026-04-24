'use client'

import { useState } from 'react'
import { Download, Loader2, ImageIcon } from 'lucide-react'

interface Props {
  bannerUrl: string
  eventTitle: string
}

export default function SaveFlyerButton({ bannerUrl, eventTitle }: Props) {
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleDownload = async () => {
    setDlState('loading')
    try {
      const res  = await fetch(bannerUrl, { mode: 'cors' })
      const blob = await res.blob()
      const ext  = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
      const name = eventTitle.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()
      const url  = URL.createObjectURL(blob)
      const a    = Object.assign(document.createElement('a'), { href: url, download: `${name || 'event-flyer'}.${ext}` })
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDlState('done')
      setTimeout(() => setDlState('idle'), 3000)
    } catch {
      window.open(bannerUrl, '_blank', 'noopener,noreferrer')
      setDlState('idle')
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={handleDownload}
        disabled={dlState === 'loading'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all disabled:opacity-60"
      >
        {dlState === 'loading' ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Saving...</>
        ) : dlState === 'done' ? (
          <><span className="text-emerald-500">✓</span> Saved!</>
        ) : (
          <><Download className="w-3.5 h-3.5 text-indigo-500" /> Save Flyer</>
        )}
      </button>
      <a
        href={bannerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-all"
      >
        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> View Full Flyer
      </a>
    </div>
  )
}
