'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  event: { title: string; slug: string } | null
  onDismiss: () => void
}

export default function WhatsAppShareToast({ event, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!event) return
    // Auto-dismiss after 6 seconds
    timerRef.current = setTimeout(onDismiss, 6000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [event, onDismiss])

  if (!event) return null

  const waText = encodeURIComponent(
    `Check out this gospel event 🙌\n\n${event.title}\n\nhttps://www.gospello.com/events/${event.slug}`
  )

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="bg-gray-950 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-2xl">
        {/* WA icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.847L.057 23.492a.5.5 0 0 0 .614.612l5.757-1.505A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.954 9.954 0 0 1-5.031-1.36l-.361-.214-3.737.977.999-3.648-.235-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>

        {/* Text + CTA */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[12px] font-semibold leading-snug line-clamp-1 mb-1">
            Your people should know about this
          </p>
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="inline-block text-[#25D366] text-[12px] font-bold hover:underline"
          >
            Share to WhatsApp →
          </a>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
