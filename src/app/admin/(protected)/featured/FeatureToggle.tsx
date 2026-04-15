'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, Star } from 'lucide-react'
import { setFeatured } from './actions'

function ToggleButton({ isFeatured }: { isFeatured: boolean }) {
  const { pending } = useFormStatus()
  if (isFeatured) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-colors disabled:opacity-60"
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3 fill-amber-400" />}
        Remove
      </button>
    )
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-medium transition-colors disabled:opacity-60"
    >
      {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
      Feature
    </button>
  )
}

export default function FeatureToggle({ eventId, isFeatured }: { eventId: string; isFeatured: boolean }) {
  const action = setFeatured.bind(null, eventId, !isFeatured)

  return (
    <form action={action}>
      <ToggleButton isFeatured={isFeatured} />
    </form>
  )
}
