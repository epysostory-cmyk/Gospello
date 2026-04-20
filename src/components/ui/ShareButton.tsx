'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  eventTitle: string
  eventUrl: string
  eventDate?: string
  eventLocation?: string
  eventDescription?: string
  bannerUrl?: string | null
}

export default function ShareButton({
  eventTitle,
  eventUrl,
  eventDate = '',
  eventLocation = '',
  eventDescription = '',
  bannerUrl,
}: Props) {
  const [copied, setCopied]   = useState(false)
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')

  /* ── Ref-tagged URLs (single line, no breaks) ── */
  const waUrl   = eventUrl + '?ref=wa'
  const tgUrl   = eventUrl + '?ref=tg'
  const xUrl    = eventUrl + '?ref=x'
  const copyUrl = eventUrl + '?ref=copy'

  /* ── Share messages ── */
  const dateLine     = eventDate     ? `📅 ${eventDate}`     : ''
  const locationLine = eventLocation ? `📍 ${eventLocation}` : ''
  const captionLines = [dateLine, locationLine].filter(Boolean).join('\n')
  const excerpt      = eventDescription ? eventDescription.slice(0, 150).trimEnd() + (eventDescription.length > 150 ? '…' : '') : ''
  const aboutBody    = [captionLines, excerpt].filter(Boolean).join('\n')
  const aboutLine    = aboutBody ? `\n\nAbout the Event\n${aboutBody}` : ''

  const waMessage = `*${eventTitle}*${aboutLine}\n\nCheck it out: ${waUrl}`
  const tgMessage = `*${eventTitle}*${aboutLine}\n\nCheck it out: ${tgUrl}`

  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(tgUrl)}&text=${encodeURIComponent(tgMessage)}`
  const xHref  = `https://x.com/intent/tweet?text=${encodeURIComponent(`${eventTitle}${eventDescription ? `\n\n${eventDescription.slice(0, 200)}` : ''}\n\nCheck it out:`)}&url=${encodeURIComponent(xUrl)}`

  /* ── Copy link ── */
  const copyLink = async () => {
    await navigator.clipboard.writeText(copyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  /* ── Download flyer ── */
  const handleDownload = async () => {
    if (!bannerUrl) return
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

  const btn = 'flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 flex-1 text-[13px] font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md select-none'

  return (
    <div>
      <p className="text-[13px] uppercase tracking-wide text-[#6B7280] mb-3">Share this event</p>

      {/* 2×2 on mobile, single row on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">

        {/* WhatsApp */}
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className={`${btn} text-white`} style={{ backgroundColor: '#25D366' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>

        {/* Telegram */}
        <a href={tgHref} target="_blank" rel="noopener noreferrer"
          className={`${btn} text-white`} style={{ backgroundColor: '#229ED9' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </a>

        {/* X / Twitter */}
        <a href={xHref} target="_blank" rel="noopener noreferrer"
          className={`${btn} text-white bg-black`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </a>

        {/* Copy Link */}
        <button onClick={copyLink}
          className={`${btn}`}
          style={{
            backgroundColor: copied ? '#ECFDF5' : '#F3F4F6',
            color:           copied ? '#059669' : '#374151',
          }}>
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

      {/* Save Flyer */}
      {bannerUrl && (
        <button
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white text-[#374151] text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-60"
        >
          {dlState === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Saving flyer...</>
          ) : dlState === 'done' ? (
            <><span className="text-emerald-500">✓</span> Saved!</>
          ) : (
            <><Download className="w-4 h-4 text-indigo-500" /> Save Flyer</>
          )}
        </button>
      )}
    </div>
  )
}
