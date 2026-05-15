'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, Star } from 'lucide-react'
import { featureEventWithDuration, unfeatureEvent } from './actions'

function FeatureButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
      Feature
    </button>
  )
}

function RemoveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-amber-500" />}
      Remove
    </button>
  )
}

export default function FeatureToggle({
  eventId,
  isFeatured,
}: {
  eventId: string
  isFeatured: boolean
}) {
  const removeAction = unfeatureEvent.bind(null, eventId)
  const featureAction = featureEventWithDuration.bind(null, eventId)

  if (isFeatured) {
    return (
      <form action={removeAction}>
        <RemoveButton />
      </form>
    )
  }

  return (
    <form action={featureAction} className="flex items-center gap-2">
      <select
        name="duration_days"
        defaultValue="30"
        className="px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] cursor-pointer"
      >
        <option value="7">7 days</option>
        <option value="14">14 days</option>
        <option value="30">30 days</option>
        <option value="60">60 days</option>
        <option value="90">90 days</option>
        <option value="0">Permanent</option>
      </select>
      <FeatureButton />
    </form>
  )
}
