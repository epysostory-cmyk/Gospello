'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter()
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
