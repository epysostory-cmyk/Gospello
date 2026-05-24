'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Loader2, ArrowRight, X, SlidersHorizontal, ChevronDown, Users } from 'lucide-react'
import WhatsAppShareToast from './WhatsAppShareToast'
import Link from 'next/link'
import Image from 'next/image'
import EventCard from '@/components/ui/EventCard'
import { NIGERIAN_STATES, formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/types/database'
import type { CategoryMap } from '@/lib/categories'
import SaveButton from '@/components/ui/SaveButton'

const LOCATION_KEY = 'gospello_user_location'
const LOCATION_TTL = 24 * 60 * 60 * 1000

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
const PAGE_SIZE = 10

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
}

interface Props {
  allEvents: Event[]
  attendanceCountMap: Record<string, number>
  catMap: CategoryMap
  categories: Category[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getWeekendRange(): { sat: string; sun: string } {
  const today = new Date()
  const day = today.getDay()
  const daysToSat = day === 6 ? 0 : (6 - day + 7) % 7
  const sat = new Date(today)
  sat.setDate(today.getDate() + daysToSat)
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  return {
    sat: sat.toISOString().split('T')[0],
    sun: sun.toISOString().split('T')[0],
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
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
  } catch {
    return null
  }
}

interface CachedLocation { state: string; lat: number; lng: number; timestamp: number }

function loadCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > LOCATION_TTL) { localStorage.removeItem(LOCATION_KEY); return null }
    return parsed ?? null
  } catch { return null }
}

function saveLocation(state: string, lat: number, lng: number) {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify({ state, lat, lng, timestamp: Date.now() })) } catch { /* ignore */ }
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'

export default function LocationAwareEvents({ allEvents, attendanceCountMap, catMap, categories }: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [pendingFrom, setPendingFrom] = useState('')
  const [pendingTo, setPendingTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')

  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const [nearMeActive, setNearMeActive] = useState(false)
  const [nearMeDetecting, setNearMeDetecting] = useState(false)
  const [nearMeState, setNearMeState] = useState<string | null>(null)
  const [nearMeTooltip, setNearMeTooltip] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [sheetStateSearch, setSheetStateSearch] = useState('')
  const [customOpen, setCustomOpen] = useState(false)

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [shareToast, setShareToast] = useState<{ title: string; slug: string } | null>(null)

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [dateFilter, stateFilter, categoryFilter, appliedFrom, appliedTo])

  // Lock body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = filterSheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filterSheetOpen])

  const handleNearMe = useCallback(() => {
    if (nearMeActive) {
      setNearMeActive(false); setNearMeState(null); setStateFilter(null); setUserCoords(null)
      return
    }

    // Restore from cache first for instant response
    const cached = loadCachedLocation()
    if (cached) {
      setNearMeState(cached.state); setStateFilter(cached.state)
      setUserCoords({ lat: cached.lat, lng: cached.lng }); setNearMeActive(true)
      return
    }

    if (!navigator.geolocation) { setNearMeTooltip(true); setTimeout(() => setNearMeTooltip(false), 3000); return }
    setNearMeDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        const state = await reverseGeocode(latitude, longitude)
        if (state) {
          setNearMeState(state); setStateFilter(state)
          setUserCoords({ lat: latitude, lng: longitude })
          setNearMeActive(true)
          saveLocation(state, latitude, longitude)
        }
        setNearMeDetecting(false)
      },
      () => { setNearMeTooltip(true); setNearMeDetecting(false); setTimeout(() => setNearMeTooltip(false), 3000) },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [nearMeActive])

  const applyCustomRange = useCallback(() => {
    if (!pendingFrom || !pendingTo) return
    setAppliedFrom(pendingFrom); setAppliedTo(pendingTo)
    setDateFilter('custom'); setCustomOpen(false)
  }, [pendingFrom, pendingTo])

  const today = todayStr()
  const tomorrow = tomorrowStr()
  const weekend = getWeekendRange()

  const filteredEvents = allEvents.filter(event => {
    const eDate = event.start_date.split('T')[0]
    const eEndDate = event.end_date ? event.end_date.split('T')[0] : eDate
    if (dateFilter === 'today' && (eDate > today || eEndDate < today)) return false
    if (dateFilter === 'tomorrow' && (eDate > tomorrow || eEndDate < tomorrow)) return false
    if (dateFilter === 'weekend' && (eDate > weekend.sun || eEndDate < weekend.sat)) return false
    if (dateFilter === 'custom') {
      if (appliedFrom && eEndDate < appliedFrom) return false
      if (appliedTo && eDate > appliedTo) return false
    }
    if (stateFilter && event.state?.toLowerCase() !== stateFilter.toLowerCase()) return false
    if (categoryFilter && event.category !== categoryFilter) return false
    return true
  })

  // When Near Me is active and we have the user's coords, sort by distance (closest first).
  // Events without coordinates fall to the end — they still show up, just unranked.
  const sortedEvents = nearMeActive && userCoords
    ? [...filteredEvents].sort((a, b) => {
        const aDist = a.latitude != null && a.longitude != null
          ? haversineKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
          : Infinity
        const bDist = b.latitude != null && b.longitude != null
          ? haversineKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
          : Infinity
        return aDist - bDist
      })
    : filteredEvents

  const displayedEvents = sortedEvents.slice(0, visibleCount)
  const hasMore = sortedEvents.length > visibleCount
  const hasActiveFilters = dateFilter !== 'all' || stateFilter !== null || categoryFilter !== null

  // Count active filters for badge
  const filterCount = (stateFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (dateFilter === 'custom' ? 1 : 0)

  const clearAllFilters = useCallback(() => {
    setDateFilter('all'); setAppliedFrom(''); setAppliedTo('')
    setPendingFrom(''); setPendingTo(''); setCustomOpen(false)
    setStateFilter(null); setNearMeActive(false); setNearMeState(null); setUserCoords(null)
    setCategoryFilter(null)
  }, [])

  const selectedCategory = categories.find(c => c.slug === categoryFilter)
  const dateFilterLabel =
    dateFilter === 'today' ? 'Today'
    : dateFilter === 'tomorrow' ? 'Tomorrow'
    : dateFilter === 'weekend' ? 'This Weekend'
    : dateFilter === 'custom' ? `${appliedFrom} – ${appliedTo}`
    : null

  const filteredStates = sheetStateSearch
    ? NIGERIAN_STATES.filter(s => s.toLowerCase().includes(sheetStateSearch.toLowerCase()))
    : NIGERIAN_STATES

  return (
    <section>
      {/* Section heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="text-gray-500 text-sm mt-1">Gospel events happening near you</p>
          </div>
          <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline flex-shrink-0 mt-1">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Near me button */}
        <div className="relative">
          <button
            onClick={handleNearMe}
            disabled={nearMeDetecting}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap disabled:opacity-60 ${
              nearMeActive
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {nearMeDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {nearMeActive && nearMeState ? <>{nearMeState} <span className="opacity-60">×</span></> : nearMeDetecting ? 'Locating…' : 'Near me'}
          </button>
          {nearMeTooltip && (
            <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-50 whitespace-nowrap">
              Enable location to see nearby events
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="sticky bg-white z-40" style={{ top: 64, borderBottom: '1px solid #F3F4F6' }}>
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div
            className="flex items-center gap-2"
            style={{ overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {/* Date quick chips */}
            {(['all', 'today', 'tomorrow', 'weekend'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setDateFilter(f); setCustomOpen(false) }}
                className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border ${
                  dateFilter === f && !customOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : 'This Weekend'}
              </button>
            ))}

            {/* Custom range */}
            <button
              onClick={() => setCustomOpen(o => !o)}
              className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                dateFilter === 'custom' || customOpen
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Custom <ChevronDown className="w-3 h-3" />
            </button>

            {/* Divider */}
            <div className="flex-shrink-0 w-px h-5 bg-gray-200 mx-1" />

            {/* Filters button */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border flex items-center gap-2 ${
                filterCount > 0
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {filterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          </div>

          {/* Custom date range picker */}
          {customOpen && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input type="date" value={pendingFrom} onChange={e => setPendingFrom(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-900 bg-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input type="date" value={pendingTo} min={pendingFrom} onChange={e => setPendingTo(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-900 bg-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={applyCustomRange} disabled={!pendingFrom || !pendingTo}
                  className="h-10 px-5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                  Apply
                </button>
                <button onClick={() => { setCustomOpen(false); if (dateFilter === 'custom') { setDateFilter('all'); setAppliedFrom(''); setAppliedTo('') }; setPendingFrom(''); setPendingTo('') }}
                  className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium whitespace-nowrap">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {dateFilterLabel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {dateFilterLabel}
                  <button onClick={() => { setDateFilter('all'); setAppliedFrom(''); setAppliedTo('') }} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {stateFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {stateFilter}
                  <button onClick={() => { setStateFilter(null); setNearMeActive(false); setNearMeState(null) }} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter && selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {selectedCategory.name}
                  <button onClick={() => setCategoryFilter(null)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button onClick={clearAllFilters} className="ml-auto text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Bottom Sheet ── */}
      {filterSheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
            onClick={() => setFilterSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Filter Events</h3>
              <button onClick={() => setFilterSheetOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">

              {/* State */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">State</p>
                <input
                  type="text"
                  value={sheetStateSearch}
                  onChange={e => setSheetStateSearch(e.target.value)}
                  placeholder="Search state..."
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-900 mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setStateFilter(null); setNearMeActive(false); setNearMeState(null) }}
                    className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                      !stateFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 border-transparent'
                    }`}
                  >
                    All States
                  </button>
                  {filteredStates.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStateFilter(s); setNearMeActive(false); setNearMeState(null) }}
                      className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                        stateFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                      !categoryFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 border-transparent'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.slug}
                      onClick={() => setCategoryFilter(c.slug)}
                      className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                        categoryFilter === c.slug ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => { setStateFilter(null); setNearMeActive(false); setNearMeState(null); setCategoryFilter(null) }}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold"
              >
                Show {filteredEvents.length} Events
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Events ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6 text-sm">Try adjusting your filters</p>
            <button onClick={clearAllFilters}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: compact list */}
            <div className="flex flex-col md:hidden gap-2.5">
              {displayedEvents.map(event => {
                const categoryInfo = catMap[event.category]
                // Relative date label
                const now = new Date(); now.setHours(0,0,0,0)
                const evDay = new Date(event.start_date); evDay.setHours(0,0,0,0)
                const diff = Math.round((evDay.getTime() - now.getTime()) / 86400000)
                const dateLabel =
                  diff < 0  ? 'Ongoing'
                  : diff === 0 ? 'Today'
                  : diff === 1 ? 'Tomorrow'
                  : diff < 7 ? `In ${diff} days`
                  : formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })
                // Only highlight today/tomorrow — never past-start events
                const isUrgent = diff === 0 || diff === 1

                const attendance = attendanceCountMap[event.id] ?? 0

                return (
                  <div
                    key={event.id}
                    className="relative rounded-2xl bg-white border border-gray-100 active:scale-[0.99] transition-transform duration-100 overflow-hidden"
                  >
                    {/* Full-card link */}
                    <Link
                      href={`/events/${event.slug}`}
                      className="flex gap-3 p-3 pr-12"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 88, height: 88 }}>
                        {event.banner_url ? (
                          <Image src={event.banner_url} alt={event.title} width={88} height={88} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-300 font-black text-2xl">{event.title[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        {/* Date — first, prominent */}
                        <p className={`text-[11px] font-bold mb-0.5 ${isUrgent ? 'text-rose-500' : 'text-gray-400'}`}>
                          {dateLabel}
                          {!event.time_tba && (
                            <span className="font-normal"> · {formatTime(event.start_date)}</span>
                          )}
                        </p>

                        <p className="font-semibold text-gray-900 leading-snug line-clamp-2 text-[13.5px]">
                          {event.title}
                        </p>

                        <p className="mt-1 text-[11.5px] text-gray-400 truncate">
                          {event.is_online ? 'Online' : [event.location_name, event.city].filter(Boolean).join(' · ') || 'Location TBD'}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${event.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {event.is_free ? 'Free' : event.price != null ? `₦${event.price.toLocaleString()}` : 'Paid'}
                          </span>
                          {attendance >= 10 && (
                            <span className="flex items-center gap-0.5 text-[10.5px] text-gray-400">
                              <Users className="w-3 h-3" />
                              {attendance} going
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Save button — outside the Link, absolutely positioned */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <SaveButton
                        eventId={event.id}
                        initialSaved={false}
                        variant="icon"
                        size="sm"
                        onSaved={() => setShareToast({ title: event.title, slug: event.slug })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedEvents.map(event => (
                <EventCard key={event.id} event={event} attendanceCount={attendanceCountMap[event.id]} categoryInfo={catMap[event.category]} />
              ))}
            </div>

            {/* Load more */}
            <div className="mt-8 pb-8 flex flex-col items-center gap-3">
              {hasMore && (
                <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="flex items-center gap-2 h-12 px-8 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
                  Load more events
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <p className="text-xs text-gray-400">Showing {displayedEvents.length} of {filteredEvents.length} events</p>
              <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-700 font-semibold hover:underline">
                See all events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* WhatsApp share toast — appears after saving an event */}
      <WhatsAppShareToast
        event={shareToast}
        onDismiss={() => setShareToast(null)}
      />
    </section>
  )
}
