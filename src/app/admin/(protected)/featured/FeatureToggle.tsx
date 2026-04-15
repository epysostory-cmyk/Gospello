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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-amber-400" />}
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
        className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
      >
        <option value="7" className="bg-[#1A1A2E]">7 days</option>
        <option value="14" className="bg-[#1A1A2E]">14 days</option>
        <option value="30" className="bg-[#1A1A2E]">30 days</option>
        <option value="60" className="bg-[#1A1A2E]">60 days</option>
        <option value="90" className="bg-[#1A1A2E]">90 days</option>
        <option value="0" className="bg-[#1A1A2E]">Permanent</option>
      </select>
      <FeatureButton />
    </form>
  )
}
