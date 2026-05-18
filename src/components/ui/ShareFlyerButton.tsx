'use client'

import { useState } from 'react'
import { Download, Share2, X, Loader2, Check, ExternalLink, ImageIcon } from 'lucide-react'

interface Props {
  slug: string
  eventTitle: string
}

export default function ShareFlyerButton({ slug, eventTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'square' | 'story'>('square')
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [sharing, setSharing] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const flyerUrl = `/api/events/${slug}/flyer?format=${format}`
  const fileName = `${eventTitle.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'event-flyer'}-${format}.png`

  function handleOpen() {
    setImgLoaded(false)
    setOpen(true)
  }

  function handleFormatChange(f: 'square' | 'story') {
    setImgLoaded(false)
    setFormat(f)
  }

  async function handleDownload() {
    setDlState('loading')
    try {
      const res = await fetch(flyerUrl)
      if (!res.ok) throw new Error('fetch failed')
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

  async function handleShare() {
    setSharing(true)
    try {
      const res = await fetch(flyerUrl)
      const blob = await res.blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: eventTitle, text: `Check out "${eventTitle}" on Gospello` })
      } else {
        await handleDownload()
      }
    } catch { /* user cancelled */ }
    setSharing(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/30"
      >
        <ImageIcon className="w-4 h-4" />
        Share Flyer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm bg-[#0f0f17] rounded-3xl overflow-hidden shadow-2xl border border-white/8 animate-in slide-in-from-bottom-4 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <p className="text-white font-bold text-sm">Event Flyer</p>
                <p className="text-white/35 text-xs mt-0.5">Gospello-branded shareable image</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            {/* Format picker */}
            <div className="px-5 pt-4">
              <div className="flex gap-2">
                {([
                  { value: 'square', label: 'Square', sub: '1:1 · WhatsApp' },
                  { value: 'story',  label: 'Story',  sub: '9:16 · Status / IG' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormatChange(opt.value)}
                    className="flex-1 flex items-center gap-3 py-3 px-3.5 rounded-2xl border transition-all text-left"
                    style={{
                      borderColor: format === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.07)',
                      background: format === opt.value ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {/* Shape icon */}
                    <div
                      className="rounded border-2 flex-shrink-0"
                      style={{
                        width: opt.value === 'square' ? 28 : 18,
                        height: opt.value === 'square' ? 28 : 32,
                        borderColor: format === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.18)',
                        background: format === opt.value ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                      }}
                    />
                    <div>
                      <p className="text-white font-bold text-xs">{opt.label}</p>
                      <p className="text-white/35 text-[10px] mt-0.5">{opt.sub}</p>
                    </div>
                    {format === opt.value && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Flyer preview — auto-loads */}
            <div className="px-5 pt-4">
              <div
                className="w-full rounded-2xl overflow-hidden bg-[#0b0b12] border border-white/8 relative"
                style={{ aspectRatio: format === 'square' ? '1/1' : '9/16', maxHeight: 260 }}
              >
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={flyerUrl}
                  src={flyerUrl}
                  alt="Event flyer preview"
                  onLoad={() => setImgLoaded(true)}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: 260, opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
                />
              </div>
            </div>

            {/* View full flyer link */}
            <div className="px-5 pt-3">
              <a
                href={flyerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View full flyer
              </a>
            </div>

            {/* Action buttons */}
            <div className="px-5 py-5 flex gap-2.5">
              <button
                onClick={handleDownload}
                disabled={dlState === 'loading'}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-semibold text-xs transition-all disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {dlState === 'loading' ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : dlState === 'done' ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-400" /> Saved!</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Save Flyer</>
                )}
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs text-white transition-all disabled:opacity-60"
                style={{ background: '#7C3AED', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
              >
                {sharing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sharing...</>
                ) : (
                  <><Share2 className="w-3.5 h-3.5" /> Share</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
