'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft } from 'lucide-react'

export default function BackButton({ label = 'Back', variant = 'default' }: { label?: string; variant?: 'default' | 'overlay' }) {
  const router = useRouter()

  if (variant === 'overlay') {
    return (
      <button
        onClick={() => router.back()}
        className="inline-flex items-center justify-center w-9 h-9 bg-black/30 backdrop-blur-md text-white rounded-full shadow-sm active:scale-95 transition-transform"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
