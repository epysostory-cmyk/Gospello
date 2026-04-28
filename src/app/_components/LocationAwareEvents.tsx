'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, ChevronDown, ChevronUp, Loader2, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EventCard from '@/components/ui/EventCard'
import { NIGERIAN_STATES, formatDate, formatTime } from '@/lib/utils'
import type { Event } from '@/types/database'
import type { CategoryMap } from '@/lib/categories'
import SaveButton from '@/components/ui/SaveButton'

const LOCATION_KEY = 'gospello_user_location'
const LOCATION_TTL = 24 * 60 * 60 * 1000
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function loadCachedLocation(): string | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const { state, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > LOCATION_TTL) { localStorage.removeItem(LOCATION_KEY); return null }
    return state ?? null
  } catch { return null }
}

function saveLocation(state: string) {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify({ state, timestamp: Date.now() })) } catch { /* ignore */ }
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'

// ── Chip component ────────────────────────────────────────────────────────────

function Chip({
  active, onClick, children, disabled,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-shrink-0 snap-start h-9 px-4 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 disabled:opacity-60 select-none"
      style={{
        background: active ? '#7C3AED' : '#F9FAFB',
        border: `1px solid ${active ? '#7C3AED' : '#E5E7EB'}`,
        color: active ? 'white' : '#374151',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      } as React.CSSProperties}
    >
      {children}
    </button>
  )
}

// ── Dropdown panel (fixed-position, avoids overflow clipping) ─────────────────

function DropdownPanel({
  anchorRect,
  children,
  panelRef,
}: {
  anchorRect: DOMRect | null
  children: React.ReactNode
  panelRef: React.RefObject<HTMLDivElement | null>
}) {
  if (!anchorRect) return null
  const PANEL_W = 232
  const MARGIN = 12
  const rawLeft = anchorRect.left
  const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 400) - PANEL_W - MARGIN
  const left = Math.max(MARGIN, Math.min(rawLeft, maxLeft))
  const top = anchorRect.bottom + 8

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-2xl p-2"
      style={{
        position: 'fixed',
        top,
        left,
        width: PANEL_W,
        zIndex: 9999,
        border: '1px solid #E5E7EB',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
      }}
    >
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LocationAwareEvents({ allEvents, attendanceCountMap, catMap, categories }: Props) {
  // Date filter
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [pendingFrom, setPendingFrom] = useState('')
  const [pendingTo, setPendingTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [customOpen, setCustomOpen] = useState(false)

  // State filter
  const [stateFilter, setStateFilter] = useState<string | null>(null)
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false)
  const [stateDropdownRect, setStateDropdownRect] = useState<DOMRect | null>(null)
  const [stateSearch, setStateSearch] = useState('')

  // Near Me
  const [nearMeActive, setNearMeActive] = useState(false)
  const [nearMeDetecting, setNearMeDetecting] = useState(false)
  const [nearMeState, setNearMeState] = useState<string | null>(null)
  const [nearMeTooltip, setNearMeTooltip] = useState(false)

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [categoryDropdownRect, setCategoryDropdownRect] = useState<DOMRect | null>(null)

  // Pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Refs for trigger elements and dropdown panels
  const stateRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const stateSearchRef = useRef<HTMLInputElement>(null)
  const statePanelRef = useRef<HTMLDivElement>(null)
  const categoryPanelRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click/touch — panels are fixed so check both trigger + panel
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      const inStateTrigger = stateRef.current?.contains(target)
      const inStatePanel = statePanelRef.current?.contains(target)
      if (!inStateTrigger && !inStatePanel) {
        setStateDropdownOpen(false)
        setStateSearch('')
      }
      const inCategoryTrigger = categoryRef.current?.contains(target)
      const inCategoryPanel = categoryPanelRef.current?.contains(target)
      if (!inCategoryTrigger && !inCategoryPanel) {
        setCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  // Focus state search input when dropdown opens
  useEffect(() => {
    if (stateDropdownOpen) {
      setTimeout(() => stateSearchRef.current?.focus(), 50)
    }
  }, [stateDropdownOpen])

  // Reset visible count whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [dateFilter, stateFilter, categoryFilter, appliedFrom, appliedTo])

  // Toggle state dropdown (capture anchor rect for fixed positioning)
  const toggleStateDropdown = useCallback(() => {
    if (stateRef.current) {
      setStateDropdownRect(stateRef.current.getBoundingClientRect())
    }
    setStateDropdownOpen(o => !o)
    setCategoryDropdownOpen(false)
  }, [])

  // Toggle category dropdown
  const toggleCategoryDropdown = useCallback(() => {
    if (categoryRef.current) {
      setCategoryDropdownRect(categoryRef.current.getBoundingClientRect())
    }
    setCategoryDropdownOpen(o => !o)
    setStateDropdownOpen(false)
    setStateSearch('')
  }, [])

  // Near Me handler
  const handleNearMe = useCallback(() => {
    if (nearMeActive) {
      setNearMeActive(false)
      setNearMeState(null)
      setStateFilter(null)
      return
    }
    if (!navigator.geolocation) { setNearMeTooltip(true); setTimeout(() => setNearMeTooltip(false), 3000); return }
    setNearMeDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const state = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        if (state) { setNearMeState(state); setStateFilter(state); setNearMeActive(true); saveLocation(state) }
        setNearMeDetecting(false)
      },
      () => {
        setNearMeTooltip(true)
        setNearMeDetecting(false)
        setTimeout(() => setNearMeTooltip(false), 3000)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }, [nearMeActive])

  // Apply custom date range
  const applyCustomRange = useCallback(() => {
    if (!pendingFrom || !pendingTo) return
    setAppliedFrom(pendingFrom)
    setAppliedTo(pendingTo)
    setDateFilter('custom')
    setCustomOpen(false)
  }, [pendingFrom, pendingTo])

  // Computed values
  const today = todayStr()
  const tomorrow = tomorrowStr()
  const weekend = getWeekendRange()

  const filteredEvents = allEvents.filter(event => {
    const eDate = event.start_date.split('T')[0]
    if (dateFilter === 'today' && eDate !== today) return false
    if (dateFilter === 'tomorrow' && eDate !== tomorrow) return false
    if (dateFilter === 'weekend' && (eDate < weekend.sat || eDate > weekend.sun)) return false
    if (dateFilter === 'custom') {
      if (appliedFrom && eDate < appliedFrom) return false
      if (appliedTo && eDate > appliedTo) return false
    }
    if (stateFilter && event.state?.toLowerCase() !== stateFilter.toLowerCase()) return false
    if (categoryFilter && event.category !== categoryFilter) return false
    return true
  })

  const displayedEvents = filteredEvents.slice(0, visibleCount)
  const hasMore = filteredEvents.length > visibleCount

  const hasActiveFilters = dateFilter !== 'all' || stateFilter !== null || categoryFilter !== null

  const clearAllFilters = useCallback(() => {
    setDateFilter('all')
    setAppliedFrom(''); setAppliedTo('')
    setPendingFrom(''); setPendingTo('')
    setCustomOpen(false)
    setStateFilter(null)
    setNearMeActive(false); setNearMeState(null)
    setCategoryFilter(null)
  }, [])

  const removeFilter = useCallback((type: 'date' | 'state' | 'category') => {
    if (type === 'date') { setDateFilter('all'); setAppliedFrom(''); setAppliedTo('') }
    if (type === 'state') { setStateFilter(null); setNearMeActive(false); setNearMeState(null) }
    if (type === 'category') setCategoryFilter(null)
  }, [])

  const filteredStates = stateSearch
    ? NIGERIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
    : NIGERIAN_STATES

  const selectedCategory = categories.find(c => c.slug === categoryFilter)

  const dateFilterLabel =
    dateFilter === 'today' ? 'Today'
    : dateFilter === 'tomorrow' ? 'Tomorrow'
    : dateFilter === 'weekend' ? 'This Weekend'
    : dateFilter === 'custom' ? `${appliedFrom} – ${appliedTo}`
    : null

  return (
    <section>
      {/* Section heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 pt-2">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
        <p className="text-gray-500 text-sm mt-1">Gospel events happening in the next 3 months</p>
      </div>

      {/* ── Sticky filter bar ──────────────────────────────────────── */}
      <div
        className="sticky bg-white z-40"
        style={{ top: 64, borderBottom: '1px solid #F3F4F6' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          {/* Filter chips row — overflow scroll; dropdown panels render fixed so they're never clipped */}
          <div
            className="flex gap-2 snap-x snap-mandatory"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {/* Date chips */}
            {(['all', 'today', 'tomorrow', 'weekend'] as const).map(f => (
              <Chip
                key={f}
                active={dateFilter === f && !customOpen}
                onClick={() => { setDateFilter(f); setCustomOpen(false) }}
              >
                {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : 'This Weekend'}
              </Chip>
            ))}

            {/* Custom range */}
            <Chip
              active={dateFilter === 'custom' || customOpen}
              onClick={() => setCustomOpen(o => !o)}
            >
              Custom Range <ChevronDown className="w-3 h-3" />
            </Chip>

            {/* Divider */}
            <div className="flex-shrink-0 w-px bg-gray-200 mx-1 self-stretch" />

            {/* State dropdown trigger */}
            <div className="flex-shrink-0 snap-start" ref={stateRef}>
              <Chip active={!!stateFilter} onClick={toggleStateDropdown}>
                {stateFilter ?? 'All States'} <ChevronDown className="w-3 h-3" />
              </Chip>
            </div>

            {/* Near Me */}
            <div className="relative flex-shrink-0 snap-start">
              <Chip active={nearMeActive} onClick={handleNearMe} disabled={nearMeDetecting}>
                {nearMeDetecting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : '📍'
                }
                {nearMeActive && nearMeState ? nearMeState : 'Near Me'}
              </Chip>
              {nearMeTooltip && (
                <div
                  className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg z-50"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Enable location to see nearby events
                </div>
              )}
            </div>

            {/* Category dropdown trigger */}
            <div className="flex-shrink-0 snap-start" ref={categoryRef}>
              <Chip active={!!categoryFilter} onClick={toggleCategoryDropdown}>
                {selectedCategory
                  ? <>{selectedCategory.icon && <span>{selectedCategory.icon}</span>}{selectedCategory.name}</>
                  : 'All Categories'
                }
                <ChevronDown className="w-3 h-3" />
              </Chip>
            </div>
          </div>

          {/* Custom date range picker */}
          {customOpen && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={pendingFrom}
                    onChange={e => setPendingFrom(e.target.value)}
                    className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm outline-none focus:border-violet-400 bg-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={pendingTo}
                    min={pendingFrom}
                    onChange={e => setPendingTo(e.target.value)}
                    className="w-full h-10 px-3 rounded-[10px] border border-gray-200 text-sm outline-none focus:border-violet-400 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyCustomRange}
                  disabled={!pendingFrom || !pendingTo}
                  className="h-10 px-5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                >
                  Show Events
                </button>
                <button
                  onClick={() => {
                    setCustomOpen(false)
                    if (dateFilter === 'custom') { setDateFilter('all'); setAppliedFrom(''); setAppliedTo('') }
                    setPendingFrom(''); setPendingTo('')
                  }}
                  className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {dateFilterLabel && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#EDE9FE', color: '#7C3AED' }}
                >
                  {dateFilterLabel}
                  <button onClick={() => removeFilter('date')} className="hover:opacity-70 flex items-center">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {stateFilter && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#EDE9FE', color: '#7C3AED' }}
                >
                  {stateFilter}
                  <button onClick={() => removeFilter('state')} className="hover:opacity-70 flex items-center">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter && selectedCategory && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: '#EDE9FE', color: '#7C3AED' }}
                >
                  {selectedCategory.icon} {selectedCategory.name}
                  <button onClick={() => removeFilter('category')} className="hover:opacity-70 flex items-center">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed-position dropdown panels (never clipped by scroll container) ── */}

      {/* State panel */}
      {stateDropdownOpen && (
        <DropdownPanel anchorRect={stateDropdownRect} panelRef={statePanelRef}>
          <input
            ref={stateSearchRef}
            value={stateSearch}
            onChange={e => setStateSearch(e.target.value)}
            placeholder="Search state..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-1.5 outline-none focus:border-violet-400"
          />
          <div className="max-h-[260px] overflow-y-auto overscroll-contain">
            {stateFilter && (
              <button
                onClick={() => { setStateFilter(null); setNearMeActive(false); setNearMeState(null); setStateDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg mb-1"
              >
                All States
              </button>
            )}
            {filteredStates.map(s => (
              <button
                key={s}
                onClick={() => {
                  setStateFilter(s)
                  setNearMeActive(false); setNearMeState(null)
                  setStateSearch(''); setStateDropdownOpen(false)
                }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors"
                style={{
                  background: s === stateFilter ? '#EDE9FE' : undefined,
                  color: s === stateFilter ? '#7C3AED' : '#374151',
                  fontWeight: s === stateFilter ? 500 : 400,
                  touchAction: 'manipulation',
                } as React.CSSProperties}
              >
                {s}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {/* Category panel */}
      {categoryDropdownOpen && (
        <DropdownPanel anchorRect={categoryDropdownRect} panelRef={categoryPanelRef}>
          <div className="max-h-[280px] overflow-y-auto overscroll-contain">
            {categoryFilter && (
              <button
                onClick={() => { setCategoryFilter(null); setCategoryDropdownOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg mb-1"
              >
                All Categories
              </button>
            )}
            {categories.map(c => (
              <button
                key={c.slug}
                onClick={() => { setCategoryFilter(c.slug); setCategoryDropdownOpen(false) }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2"
                style={{
                  background: c.slug === categoryFilter ? '#EDE9FE' : undefined,
                  color: c.slug === categoryFilter ? '#7C3AED' : '#374151',
                  fontWeight: c.slug === categoryFilter ? 500 : 400,
                  touchAction: 'manipulation',
                } as React.CSSProperties}
              >
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}

      {/* ── Events ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters</p>
            <button
              onClick={clearAllFilters}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: compact list cards */}
            <div className="flex flex-col md:hidden" style={{ gap: 10 }}>
              {displayedEvents.map(event => {
                const categoryInfo = catMap[event.category]
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="flex gap-3 p-3 rounded-2xl bg-white active:bg-[#F9FAFB] active:scale-[0.99] transition-all duration-100"
                    style={{ border: '0.5px solid #E5E7EB' }}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 90, height: 90 }}>
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          width={90}
                          height={90}
                          className="object-cover object-center w-full h-full"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{ background: 'linear-gradient(135deg, #4F1787, #7C3AED)' }}
                        >
                          <span className="text-2xl leading-none">{categoryInfo?.icon ?? '🎵'}</span>
                          <span
                            className="text-white font-bold text-center leading-tight px-1"
                            style={{ fontSize: 8, letterSpacing: '1px' }}
                          >
                            {categoryInfo?.name ?? event.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: event.is_free ? '#059669' : '#2563EB',
                            color: 'white',
                          }}
                        >
                          {event.is_free
                            ? 'Free'
                            : event.price != null
                              ? `₦${event.price.toLocaleString()}`
                              : 'Paid'
                          }
                        </span>
                        {categoryInfo && (
                          <span className="text-[11px] text-[#6B7280] truncate">
                            {categoryInfo.icon} {categoryInfo.name}
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-1 font-medium text-[#111827] leading-snug line-clamp-2"
                        style={{ fontSize: 14 }}
                      >
                        {event.title}
                      </p>
                      <p className="mt-1.5 text-[12px] text-[#6B7280]">
                        {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(event.start_date)}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B7280] truncate">
                        {event.is_online
                          ? 'Online'
                          : [event.location_name, event.city].filter(Boolean).join(' · ') || event.state || ''
                        }
                      </p>
                      <div className="mt-2" onClick={e => e.preventDefault()}>
                        <SaveButton eventId={event.id} initialSaved={false} variant="icon" size="sm" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  attendanceCount={attendanceCountMap[event.id]}
                  categoryInfo={catMap[event.category]}
                />
              ))}
            </div>

            {/* Pagination / Load More */}
            <div className="mt-8 pb-8 flex flex-col items-center gap-3">
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="flex items-center gap-2 h-12 px-8 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors w-full sm:w-auto justify-center"
                >
                  Load more events
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <p className="text-xs text-gray-400">
                Showing {displayedEvents.length} of {filteredEvents.length} events
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                See all events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
