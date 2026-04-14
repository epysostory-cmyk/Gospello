'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  eventTitle: string
  eventUrl: string
}

export default function ShareButton({ eventTitle, eventUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waText = encodeURIComponent(`Check out this gospel event: ${eventTitle}\n${eventUrl}`)
  const twText = encodeURIComponent(`${eventTitle}`)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">Share this Event</h3>
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-xs font-medium py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <span className="text-lg">💬</span>
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${twText}&url=${encodeURIComponent(eventUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-xs font-medium py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
        >
          <span className="text-lg">🐦</span>
          Twitter
        </a>
        <button
          onClick={copyLink}
          className="flex flex-col items-center gap-1 text-xs font-medium py-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
