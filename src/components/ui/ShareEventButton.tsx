'use client'

import { useState, useEffect } from 'react'
import { Share2, X, Download, ExternalLink, Check, Loader2 } from 'lucide-react'

interface Props {
  slug: string
  eventTitle: string
  eventUrl: string
  eventDate?: string
  eventLocation?: string
  eventDescription?: string
}

export default function ShareEventButton({
  slug, eventTitle, eventUrl, eventDate = '', eventLocation = '', eventDescription = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')

  const flyerUrl = `/api/events/${slug}/flyer?format=square`
  const fileName = `${eventTitle.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'event-flyer'}.png`

  const waUrl = eventUrl + '?ref=wa'
  const tgUrl = eventUrl + '?ref=tg'
  const xUrl  = eventUrl + '?ref=x'

  const dateLine     = eventDate     ? `\n📅 ${eventDate}`     : ''
  const locationLine = eventLocation ? `\n📍 ${eventLocation}` : ''

  const waMessage = `Hey 👋 Check out this gospel event on Gospello!\n\n🎵 ${eventTitle}${dateLine}${locationLine}\n\nDon't miss it 👉 ${waUrl}`
  const tgMessage = `Hey 👋 Check out this gospel event on Gospello!\n\n🎵 ${eventTitle}${dateLine}${locationLine}\n\nDon't miss it 👉 ${tgUrl}`

  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(tgUrl)}&text=${encodeURIComponent(tgMessage)}`
  const xHref  = `https://x.com/intent/tweet?text=${encodeURIComponent(`🎵 ${eventTitle}${dateLine}${locationLine}\n\nDon't miss it 👉`)}&url=${encodeURIComponent(xUrl)}`

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function copyLink() {
    await navigator.clipboard.writeText(eventUrl + '?ref=copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleSave() {
    setDlState('loading')
    try {
      const res = await fetch(flyerUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDlState('done')
      setTimeout(() => setDlState('idle'), 2500)
    } catch {
      window.open(flyerUrl, '_blank', 'noopener,noreferrer')
      setDlState('idle')
    }
  }

  const socialBtn = 'flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3.5 flex-1 text-[12px] font-bold transition-all duration-150 active:scale-95 select-none'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-semibold py-2.5 rounded-xl hover:bg-[#6D28D9] transition-colors text-sm shadow-sm shadow-purple-200"
      >
        <Share2 className="w-4 h-4" />
        Share This Event
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">Share This Event</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[240px]">{eventTitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {/* Social share row */}
            <div className="px-4 pb-1">
              <div className="flex gap-2">
                {/* WhatsApp */}
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                  className={`${socialBtn} text-white`} style={{ background: '#25D366' }}
                  onClick={() => setOpen(false)}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>

                {/* Telegram */}
                <a href={tgHref} target="_blank" rel="noopener noreferrer"
                  className={`${socialBtn} text-white`} style={{ background: '#229ED9' }}
                  onClick={() => setOpen(false)}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </a>

                {/* X */}
                <a href={xHref} target="_blank" rel="noopener noreferrer"
                  className={`${socialBtn} text-white bg-black`}
                  onClick={() => setOpen(false)}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X
                </a>

                {/* Copy link */}
                <button
                  onClick={copyLink}
                  className={`${socialBtn}`}
                  style={{ background: copied ? '#ECFDF5' : '#F3F4F6', color: copied ? '#059669' : '#374151' }}
                >
                  {copied ? (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 my-3 border-t border-gray-100" />

            {/* Flyer section */}
            <div className="px-4 pb-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Event Flyer</p>
              <div className="flex gap-2">
                <a
                  href={flyerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                  View Flyer
                </a>
                <button
                  onClick={handleSave}
                  disabled={dlState === 'loading'}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
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
            </div>

          </div>
        </div>
      )}
    </>
  )
}
