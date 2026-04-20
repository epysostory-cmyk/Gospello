'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, ChevronDown, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import EventCard from '@/components/ui/EventCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { NIGERIAN_STATES } from '@/lib/utils'
import type { Event } from '@/types/database'
import type { CategoryMap } from '@/lib/categories'

const LOCATION_KEY = 'gospello_user_location'
const LOCATION_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CachedLocation {
  state: string
  timestamp: number
}

interface Props {
  allEvents: Event[]
  attendanceCountMap: Record<string, number>
  catMap: CategoryMap
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const state: string = data?.address?.state ?? ''
    // Nominatim returns "Lagos State", "Abuja Federal Capital Territory", etc.
    // Normalise to match NIGERIAN_STATES list
    const cleaned = state.replace(/\s+State$/i, '').replace(/Federal Capital Territory.*/i, 'FCT').trim()
    // Try exact match first, then partial
    const exact = NIGERIAN_STATES.find(s => s.toLowerCase() === cleaned.toLowerCase())
    if (exact) return exact
    const partial = NIGERIAN_STATES.find(s => cleaned.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cleaned.toLowerCase()))
    return partial ?? null
  } catch {
    return null
  }
}

function loadCachedLocation(): string | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const cached: CachedLocation = JSON.parse(raw)
    if (Date.now() - cached.timestamp > LOCATION_TTL) {
      localStorage.removeItem(LOCATION_KEY)
      return null
    }
    return cached.state
  } catch {
    return null
  }
}

function saveLocation(state: string) {
  try {
    const data: CachedLocation = { state, timestamp: Date.now() }
    localStorage.setItem(LOCATION_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export default function LocationAwareEvents({ allEvents, attendanceCountMap, catMap }: Props) {
  const [detectedState, setDetectedState] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const activeState = selectedState ?? detectedState

  // On mount: load cached location, then detect if none
  useEffect(() => {
    const cached = loadCachedLocation()
    if (cached) {
      setDetectedState(cached)
      return
    }
    // Auto-detect on first visit (non-blocking)
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const state = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        if (state) {
          setDetectedState(state)
          saveLocation(state)
        }
        setDetecting(false)
      },
      () => {
        setPermissionDenied(true)
        setDetecting(false)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  const handleSelectState = useCallback((state: string) => {
    setSelectedState(state)
    saveLocation(state)
    setDropdownOpen(false)
  }, [])

  const handleClearLocation = useCallback(() => {
    setSelectedState(null)
    setDetectedState(null)
    try { localStorage.removeItem(LOCATION_KEY) } catch { /* ignore */ }
    setDropdownOpen(false)
  }, [])

  // Filter events by active state; fall back if < 3
  const filtered = activeState
    ? allEvents.filter(e => e.state?.toLowerCase() === activeState.toLowerCase())
    : []
  const showLocalEvents = filtered.length >= 1
  const displayEvents = showLocalEvents && activeState ? filtered : allEvents

  const sectionTitle = showLocalEvents && activeState
    ? `Events in ${activeState}`
    : 'Upcoming Events'
  const sectionSubtitle = showLocalEvents && activeState
    ? `Gospel events near you in ${activeState}`
    : 'Gospel events happening in the next 3 months'

  return (
    <section>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{sectionTitle}</h2>
            {detecting && (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-gray-500 text-sm">{sectionSubtitle}</p>
        </div>

        {/* State selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span className="max-w-[90px] truncate">
              {activeState ?? 'Near me'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto py-1">
                  {/* Clear option */}
                  {activeState && (
                    <button
                      onClick={handleClearLocation}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-50"
                    >
                      Show all states
                    </button>
                  )}
                  {NIGERIAN_STATES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSelectState(s)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        s === activeState
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* "No events near you" fallback banner when state is set but < 3 events */}
      {activeState && !showLocalEvents && allEvents.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            Not enough events in {activeState} yet — showing all upcoming events instead.
          </span>
        </div>
      )}

      {/* Events grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {displayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            attendanceCount={attendanceCountMap[event.id]}
            categoryInfo={catMap[event.category]}
          />
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href={activeState && showLocalEvents ? `/events?state=${encodeURIComponent(activeState)}` : '/events'}
          className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
        >
          See all events
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
