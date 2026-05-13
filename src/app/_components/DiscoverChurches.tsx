'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft, MapPin, Loader2 } from 'lucide-react'

interface ChurchEntry {
  id: string
  name: string
  slug: string
  logo_url: string | null
  denomination: string | null
  city: string
  state: string
  verified_badge: boolean
}

interface Props {
  churches: ChurchEntry[]
}

export default function DiscoverChurches({ churches }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [denomFilter, setDenomFilter] = useState<string | null>(null)
  const [nearMeState, setNearMeState] = useState<'idle' | 'loading' | 'found' | 'denied' | 'error'>('idle')
  const [nearMeLabel, setNearMeLabel] = useState<string | null>(null)

  const handleNearMe = () => {
    if (!navigator.geolocation) { setNearMeState('error'); return }
    setNearMeState('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const region: string =
            data.address?.state ||
            data.address?.region ||
            data.address?.county ||
            ''
          if (!region) { setNearMeState('error'); return }
          // Try to match against known states in the list
          const match = churches.find(c =>
            c.state && region.toLowerCase().includes(c.state.toLowerCase())
          )?.state ?? region
          setStateFilter(match)
          setNearMeLabel(match)
          setNearMeState('found')
        } catch {
          setNearMeState('error')
        }
      },
      () => setNearMeState('denied')
    )
  }

  const clearNearMe = () => {
    setNearMeState('idle')
    setNearMeLabel(null)
    setStateFilter(null)
  }

  const states = [...new Set(churches.map(c => c.state).filter(Boolean))].sort()
  const denoms = [...new Set(churches.map(c => c.denomination).filter(Boolean))].sort() as string[]

  const filtered = churches.filter(c => {
    if (stateFilter && c.state !== stateFilter) return false
    if (denomFilter && c.denomination !== denomFilter) return false
    return true
  })

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener('scroll', updateScrollState)
  }, [filtered])

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 })
  }, [stateFilter, denomFilter])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 380 : -380, behavior: 'smooth' })
  }

  if (churches.length === 0) return null

  return (
    <section className="py-12 border-t border-gray-100">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Find a church near you</h2>
            <p className="text-gray-500 mt-0.5 text-sm">New to a city? Looking for where to worship?</p>
          </div>
          <Link href="/churches" className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline transition-colors flex-shrink-0 mt-1">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {nearMeState === 'found' ? (
            <button
              onClick={clearNearMe}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium bg-gray-900 text-white whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5" />
              {nearMeLabel}
              <span className="ml-0.5 opacity-70">×</span>
            </button>
          ) : (
            <button
              onClick={handleNearMe}
              disabled={nearMeState === 'loading'}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {nearMeState === 'loading'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MapPin className="w-3.5 h-3.5" />
              }
              {nearMeState === 'loading' ? 'Locating…' : nearMeState === 'denied' ? 'Location denied' : nearMeState === 'error' ? 'Try again' : 'Near me'}
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors ml-auto"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {(states.length > 0 || denoms.length > 0) && (
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {states.map(s => (
            <button
              key={s}
              onClick={() => setStateFilter(stateFilter === s ? null : s)}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border ${
                stateFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
              }`}
            >
              📍 {s}
            </button>
          ))}
          {states.length > 0 && denoms.length > 0 && (
            <div className="flex-shrink-0 w-px bg-gray-200 mx-1 self-stretch" />
          )}
          {denoms.map(d => (
            <button
              key={d}
              onClick={() => setDenomFilter(denomFilter === d ? null : d)}
              className={`flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border ${
                denomFilter === d
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
          {(stateFilter || denomFilter) && (
            <button
              onClick={() => { setStateFilter(null); setDenomFilter(null) }}
              className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium text-gray-500 bg-white border border-gray-200 whitespace-nowrap hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
          No churches match that filter.
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {filtered.map((church) => (
            <Link
              key={church.id}
              href={`/churches/${church.slug}`}
              className="group flex-shrink-0 snap-start w-[160px] md:w-[176px] bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center hover:border-gray-300 hover:shadow-sm transition-all"
            >
              {/* Logo */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3 flex-shrink-0">
                {church.logo_url ? (
                  <Image src={church.logo_url} alt={church.name} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-2xl">⛪</span>
                )}
              </div>

              {/* Name */}
              <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-gray-600 transition-colors">
                {church.name}
                {church.verified_badge && <span className="text-amber-500 ml-0.5 text-xs" title="Verified">✓</span>}
              </p>

              {church.denomination && (
                <span className="inline-block bg-gray-100 text-gray-500 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1 truncate max-w-full">
                  {church.denomination}
                </span>
              )}

              <p className="text-[11px] text-gray-400 mt-auto pt-2">
                {[church.city, church.state].filter(Boolean).join(', ')}
              </p>
            </Link>
          ))}
          <div className="flex-shrink-0 w-4" />
        </div>
      )}
    </section>
  )
}
