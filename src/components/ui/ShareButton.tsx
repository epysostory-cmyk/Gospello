'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface Props {
  eventTitle: string
  eventUrl: string
  eventDate?: string
  eventLocation?: string
}

export default function ShareButton({ eventTitle, eventUrl, eventDate = '', eventLocation = '' }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ?ref=wa gives WhatsApp a URL it hasn't cached, forcing a fresh OG scrape
  const waShareUrl = `${eventUrl}?ref=wa`
  const waMessage = `Hey 👋 I found this gospel event on Gospello!\n\n🎵 ${eventTitle}${eventDate ? `\n📅 ${eventDate}` : ''}${eventLocation ? `\n📍 ${eventLocation}` : ''}\n\nCheck it out 👉 ${waShareUrl}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}`

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Share this event</p>
      <div className="flex gap-2">
        {/* WhatsApp */}
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>

        {/* X (Twitter) */}
        <a href={xUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md bg-black"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X
        </a>

        {/* Copy link */}
        <button onClick={copyLink}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 ${
            copied ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:shadow-md'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
