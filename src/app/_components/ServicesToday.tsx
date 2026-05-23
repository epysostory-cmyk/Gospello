'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, MapPin, Loader2, X } from 'lucide-react'
import { NIGERIAN_STATES } from '@/lib/utils'

interface ChurchWithTimes {
  id: string
  name: string
  slug: string
  city: string
  state: string
  service_times: string
  logo_url: string | null
  denomination: string | null
  verified_badge: boolean
}

interface Props {
  churches: ChurchWithTimes[]
}

const DAY_SHORT = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_FULL  = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MAX_DISPLAY = 6
const LOCATION_KEY = 'gospello_user_location'
const LOCATION_TTL = 24 * 60 * 60 * 1000

function churchHasServiceToday(serviceTimes: string, dayIndex: number): boolean {
  const lower = serviceTimes.toLowerCase()
  return lower.includes(DAY_SHORT[dayIndex]) || lower.includes(DAY_FULL[dayIndex])
}

function extractTimesForDay(serviceTimes: string, dayIndex: number): string {
  const lower = serviceTimes.toLowerCase()
  const dayFull  = DAY_FULL[dayIndex]
  const dayShort = DAY_SHORT[dayIndex]
  const regex = new RegExp(`(${dayShort}[a-z]*|${dayFull})s?[:\\s]*([^,\\n]+)`, 'i')
  const match = lower.match(regex)
  if (match) {
    const idx = lower.indexOf(match[0])
    const original = serviceTimes.substring(idx, idx + match[0].length).trim()
    return original.length < 60 ? original : serviceTimes
  }
  return serviceTimes
}

function mapsUrl(name: string, city: string, state: string) {
  const q = [name, city, state].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

function loadCachedState(): string | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > LOCATION_TTL) {
      localStorage.removeItem(LOCATION_KEY)
      return null
    }
    return parsed.state ?? null
  } catch { return null }
}

function saveLocationCache(state: string, lat: number, lng: number) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ state, lat, lng, timestamp: Date.now() }))
  } catch { /* ignore */ }
}

async function reverseGeocodeState(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const raw: string = data?.address?.state ?? ''
    const cleaned = raw.replace(/\s+State$/i, '').replace(/Federal Capital Territory.*/i, 'FCT').trim()
    return (
      NIGERIAN_STATES.find(s => s.toLowerCase() === cleaned.toLowerCase()) ??
      NIGERIAN_STATES.find(s =>
        cleaned.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(cleaned.toLowerCase())
      ) ??
      null
    )
  } catch { return null }
}

export default function ServicesToday({ churches }: Props) {
  const [nearMeState, setNearMeState] = useState<'idle' | 'loading' | 'active' | 'denied'>('idle')
  const [activeState, setActiveState] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [showStatePicker, setShowStatePicker] = useState(false)

  // On mount — restore from cache silently (no prompt)
  useEffect(() => {
    const cached = loadCachedState()
    if (cached) {
      setActiveState(cached)
      setNearMeState('active')
      setStateFilter(cached)
    }
  }, [])

  const { todayIndex, todayName, allMatching } = useMemo(() => {
    const now = new Date()
    const idx = now.getDay()
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const filtered = churches.filter(c => churchHasServiceToday(c.service_times, idx))
    return { todayIndex: idx, todayName: names[idx], allMatching: filtered }
  }, [churches])

  // Apply state filter on top of today's matching churches
  const filtered = useMemo(() => {
    if (!stateFilter) return allMatching
    return allMatching.filter(c => c.state?.toLowerCase() === stateFilter.toLowerCase())
  }, [allMatching, stateFilter])

  const displayed = filtered.slice(0, MAX_DISPLAY)
  const overflow  = Math.max(0, filtered.length - MAX_DISPLAY)

  // Unique states in today's matching set — for manual state picker
  const availableStates = useMemo(() => {
    const seen = new Set<string>()
    return allMatching
      .map(c => c.state)
      .filter(s => { if (!s || seen.has(s)) return false; seen.add(s); return true })
      .sort()
  }, [allMatching])

  const handleNearMe = useCallback(async () => {
    // Toggle off
    if (nearMeState === 'active') {
      setNearMeState('idle')
      setActiveState(null)
      setStateFilter(null)
      return
    }

    // Read from cache first — instant, no prompt
    const cached = loadCachedState()
    if (cached) {
      setActiveState(cached)
      setNearMeState('active')
      setStateFilter(cached)
      return
    }

    if (!navigator.geolocation) {
      setShowStatePicker(true)
      return
    }

    setNearMeState('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const state = await reverseGeocodeState(latitude, longitude)
        if (state) {
          saveLocationCache(state, latitude, longitude)
          setActiveState(state)
          setNearMeState('active')
          setStateFilter(state)
        } else {
          setNearMeState('idle')
          setShowStatePicker(true)
        }
      },
      () => {
        setNearMeState('denied')
        setShowStatePicker(true)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [nearMeState])

  const handleStateSelect = (state: string) => {
    setStateFilter(state)
    setActiveState(state)
    setNearMeState('active')
    setShowStatePicker(false)
  }

  const clearNearMe = () => {
    setNearMeState('idle')
    setActiveState(null)
    setStateFilter(null)
    setShowStatePicker(false)
  }

  if (allMatching.length === 0) return null

  const dayParam = todayName.toLowerCase()
  const isNearMeActive = nearMeState === 'active'
  const noResults = isNearMeActive && filtered.length === 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
      <section>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Services today</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isNearMeActive && activeState
                ? `${filtered.length} ${filtered.length === 1 ? 'church' : 'churches'} near you in ${activeState}`
                : `${allMatching.length} ${allMatching.length === 1 ? 'church' : 'churches'} with services this ${todayName}`
              }
            </p>
          </div>
          <Link
            href={`/churches?day=${dayParam}${stateFilter ? `&state=${encodeURIComponent(stateFilter)}` : ''}`}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0 mt-0.5"
          >
            See all
          </Link>
        </div>

        {/* ── Near Me control row ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Near me button */}
          <button
            onClick={handleNearMe}
            disabled={nearMeState === 'loading'}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors disabled:opacity-60 ${
              isNearMeActive
                ? 'bg-gray-950 text-white border-gray-950'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 active:bg-gray-50'
            }`}
          >
            {nearMeState === 'loading'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <MapPin className="w-3.5 h-3.5" />
            }
            {nearMeState === 'loading'
              ? 'Locating…'
              : isNearMeActive && activeState
                ? <>{activeState} <span className="opacity-50 ml-0.5">×</span></>
                : 'Near me'
            }
          </button>

          {/* State chips — manual picker or fallback when denied */}
          {showStatePicker && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1 w-full">
              <span className="text-xs text-gray-400 font-medium mr-1">Pick your state:</span>
              {availableStates.map(s => (
                <button
                  key={s}
                  onClick={() => handleStateSelect(s)}
                  className={`h-8 px-3 rounded-full text-[12px] font-semibold border transition-colors ${
                    stateFilter === s
                      ? 'bg-gray-950 text-white border-gray-950'
                      : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
              <button onClick={() => setShowStatePicker(false)} className="ml-1 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active state filter tag (when set manually) */}
          {isNearMeActive && !showStatePicker && activeState && nearMeState === 'active' && (
            <button
              onClick={clearNearMe}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Clear
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* ── No results state ── */}
        {noResults ? (
          <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm font-semibold text-gray-700">
              No churches found in {activeState} for today
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Try a different state or browse all churches</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowStatePicker(true)}
                className="h-9 px-4 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Change state
              </button>
              <Link
                href={`/churches?day=${dayParam}`}
                className="h-9 px-4 rounded-xl text-sm font-semibold bg-gray-950 text-white hover:bg-gray-800 transition-colors flex items-center"
              >
                See all {todayName} churches
              </Link>
            </div>
          </div>
        ) : (
          /* ── Cards ── */
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {displayed.map(church => {
              const timesText = extractTimesForDay(church.service_times, todayIndex)
              const directionsHref = mapsUrl(church.name, church.city, church.state)

              return (
                <div
                  key={church.id}
                  className="relative flex-shrink-0 w-[240px] sm:w-auto bg-white border border-gray-200 rounded-2xl overflow-hidden snap-start hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  {/* Main tap → church profile */}
                  <Link href={`/churches/${church.slug}`} className="block p-4 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {church.logo_url ? (
                          <Image src={church.logo_url} alt={church.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg font-black text-gray-300">{church.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                            {church.name}
                          </p>
                          {church.verified_badge && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          )}
                        </div>
                        {church.denomination && (
                          <p className="text-xs text-gray-400 truncate">{church.denomination}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {[church.city, church.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Service time */}
                    <div className="mt-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 leading-snug line-clamp-2">
                        {timesText}
                      </p>
                    </div>
                  </Link>

                  {/* Directions — always visible, more prominent when Near Me active */}
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className={`flex items-center justify-between px-4 py-2.5 border-t text-xs font-semibold transition-colors ${
                      isNearMeActive
                        ? 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200'
                        : 'border-gray-100 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Services today
                    </span>
                    <span>Get directions →</span>
                  </a>
                </div>
              )
            })}

            {/* End-cap */}
            {overflow > 0 && (
              <Link
                href={`/churches?day=${dayParam}${stateFilter ? `&state=${encodeURIComponent(stateFilter)}` : ''}`}
                className="group flex-shrink-0 snap-start w-[240px] sm:w-auto border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-5 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all"
              >
                <p className="text-2xl font-black text-gray-300 group-hover:text-gray-500 transition-colors">
                  +{overflow}
                </p>
                <p className="text-[13px] font-semibold text-gray-600 mt-1 leading-snug">
                  more {isNearMeActive && activeState ? `in ${activeState}` : `${todayName} services`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Tap to see all</p>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
