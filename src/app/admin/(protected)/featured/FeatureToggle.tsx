'use client'

import { useState, useTransition } from 'react'
import { Loader2, Star } from 'lucide-react'
import { featureEventWithDuration, unfeatureEvent } from './actions'

export default function FeatureToggle({
  eventId,
  isFeatured,
}: {
  eventId: string
  isFeatured: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [days, setDays] = useState('30')

  const handleFeature = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('duration_days', days)
      await featureEventWithDuration(eventId, formData)
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      await unfeatureEvent(eventId)
    })
  }

  if (isFeatured) {
    return (
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-amber-500" />}
        Remove
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={days}
        onChange={e => setDays(e.target.value)}
        disabled={isPending}
        className="px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] cursor-pointer disabled:opacity-60"
      >
        <option value="7">7 days</option>
        <option value="14">14 days</option>
        <option value="30">30 days</option>
        <option value="60">60 days</option>
        <option value="90">90 days</option>
        <option value="0">Permanent</option>
      </select>
      <button
        onClick={handleFeature}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
        Feature
      </button>
    </div>
  )
}
