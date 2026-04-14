'use client'

import { useState } from 'react'
import { Loader2, Star, ChevronDown } from 'lucide-react'
import { toggleFeatured } from './actions'

interface Props {
  id: string
  table: 'events' | 'churches'
  isFeatured: boolean
  featuredUntil?: string | null
}

const DURATIONS = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
]

export default function FeaturedToggle({ id, table, isFeatured, featuredUntil }: Props) {
  const [featured, setFeatured] = useState(isFeatured)
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [customDays, setCustomDays] = useState('')

  const applyFeature = async (days?: number) => {
    setLoading(true)
    setShowPicker(false)
    const newVal = true
    setFeatured(newVal)
    try {
      await toggleFeatured(id, table, newVal, days ?? null)
    } catch {
      setFeatured(false)
    } finally {
      setLoading(false)
    }
  }

  const removeFeature = async () => {
    setLoading(true)
    setFeatured(false)
    try {
      await toggleFeatured(id, table, false)
    } catch {
      setFeatured(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDays = () => {
    const d = parseInt(customDays)
    if (!isNaN(d) && d > 0) applyFeature(d)
  }

  // Show expiry if set
  const expiryLabel = featuredUntil
    ? `Until ${new Date(featuredUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : null

  if (featured) {
    return (
      <div className="flex items-center gap-2">
        {expiryLabel && <span className="text-xs text-amber-600">{expiryLabel}</span>}
        <button
          onClick={removeFeature}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 fill-amber-500" />}
          Featured
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={() => table === 'churches' ? applyFeature() : setShowPicker(!showPicker)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-l-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-60 border-r border-gray-200"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
          Feature
        </button>
        {table === 'events' && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={loading}
            className="px-1.5 py-1.5 rounded-r-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showPicker && (
        <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-48 space-y-1">
          <p className="text-xs font-semibold text-gray-500 px-2 pb-1">Feature for:</p>
          {DURATIONS.map((d) => (
            <button
              key={d.days}
              onClick={() => applyFeature(d.days)}
              className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {d.label}
            </button>
          ))}
          <button
            onClick={() => applyFeature()}
            className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-gray-400"
          >
            No expiry
          </button>
          <div className="border-t border-gray-100 pt-2 flex gap-1.5">
            <input
              type="number"
              min="1"
              max="365"
              placeholder="Days"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={handleCustomDays}
              className="text-xs px-2 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
