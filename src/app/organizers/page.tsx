import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Explore Organizers — Gospello' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, SeededOrganizer } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import OrganizerProfileCard from '@/components/ui/OrganizerProfileCard'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'

interface SearchParams {
  q?: string
  ministry?: string
  page?: string
}

const PAGE_SIZE = 24

interface OrganizerEntry {
  id: string
  slug: string
  name: string
  avatarUrl: string | null
  description: string | null
  eventCount: number
  isSeeded: boolean
  isClaimed: boolean
  isVerified: boolean
  sortScore: number
  ministryType: string | null
  city: string
  state: string
}

export default async function OrganizersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [authRes, seededRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('account_type', 'organizer')
      .eq('is_hidden', false)
      .then(r => r),
    adminClient
      .from('seeded_organizers')
      .select('*')
      .eq('is_hidden', false)
      .then(r => r),
  ])

  const authOrganizers = (authRes.data ?? []) as Profile[]
  const seededOrganizers = (seededRes.data ?? []) as SeededOrganizer[]

  const eventCountMap: Record<string, number> = {}

  if (authOrganizers.length > 0) {
    const { data: rows } = await adminClient
      .from('events')
      .select('organizer_id, start_date, end_date')
      .eq('status', 'approved')
      .is('seeded_organizer_id', null)
      .in('organizer_id', authOrganizers.map(o => o.id))
    for (const r of rows ?? []) {
      if (getEventLifecycle(r.start_date, r.end_date) !== 'ended')
        eventCountMap[r.organizer_id] = (eventCountMap[r.organizer_id] ?? 0) + 1
    }
  }

  if (seededOrganizers.length > 0) {
    const { data: rows } = await adminClient
      .from('events')
      .select('seeded_organizer_id, start_date, end_date')
      .eq('status', 'approved')
      .in('seeded_organizer_id', seededOrganizers.map(o => o.id))
    for (const r of rows ?? []) {
      if (r.seeded_organizer_id && getEventLifecycle(r.start_date, r.end_date) !== 'ended')
        eventCountMap[r.seeded_organizer_id] = (eventCountMap[r.seeded_organizer_id] ?? 0) + 1
    }
  }

  let entries: OrganizerEntry[] = [
    ...authOrganizers.map(o => ({
      id: o.id,
      slug: o.id,
      name: o.display_name,
      avatarUrl: o.avatar_url,
      description: (o as unknown as { description?: string | null }).description ?? null,
      eventCount: eventCountMap[o.id] ?? 0,
      isSeeded: false,
      isClaimed: true,
      isVerified: false,
      sortScore: 2,
      ministryType: o.ministry_type ?? null,
      city: '',
      state: o.state ?? '',
    })),
    ...seededOrganizers.map(o => ({
      id: o.id,
      slug: o.slug,
      name: o.name,
      avatarUrl: o.logo_url,
      description: (o as unknown as { description?: string | null }).description ?? null,
      eventCount: eventCountMap[o.id] ?? 0,
      isSeeded: true,
      isClaimed: o.is_claimed,
      isVerified: o.verified_badge,
      sortScore: o.verified_badge ? 3 : o.is_claimed ? 2 : o.claim_requested_at ? 1 : 0,
      ministryType: o.ministry_type ?? null,
      city: o.city ?? '',
      state: o.state ?? '',
    })),
  ]

  // Build ministry type list sorted by frequency
  const ministryCounts: Record<string, number> = {}
  for (const e of entries) {
    if (e.ministryType) ministryCounts[e.ministryType] = (ministryCounts[e.ministryType] ?? 0) + 1
  }
  const ministryTypes = Object.entries(ministryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([m]) => m)

  // Apply filters
  if (params.q) {
    const q = params.q.toLowerCase()
    entries = entries.filter(e => e.name.toLowerCase().includes(q))
  }
  if (params.ministry) {
    entries = entries.filter(e => e.ministryType === params.ministry)
  }

  entries.sort((a, b) => b.sortScore - a.sortScore || a.name.localeCompare(b.name))

  const total = entries.length
  const page = parseInt(params.page ?? '1', 10)
  const pages = Math.ceil(total / PAGE_SIZE)
  const paginated = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = !!(params.q || params.ministry)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    const str = qs.toString()
    return `/organizers${str ? `?${str}` : ''}`
  }

  const showingFrom = (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Organizers</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {total > 0 ? (
                  <><span className="font-semibold text-gray-600">{total.toLocaleString()}</span> ministries &amp; event hosts</>
                ) : 'Ministries and event hosts across Nigeria'}
              </p>
            </div>
          </div>

          {/* Search form */}
          <form method="GET" action="/organizers" className="flex gap-2 mb-3">
            {params.ministry && <input type="hidden" name="ministry" value={params.ministry} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search organizers..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              />
            </div>
            <button type="submit"
              className="flex-shrink-0 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              Search
            </button>
            {params.q && (
              <Link href={buildUrl({ q: undefined, page: undefined })}
                className="flex-shrink-0 flex items-center px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                <X className="w-4 h-4" />
              </Link>
            )}
          </form>

          {/* Ministry type chips */}
          {ministryTypes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0"
              style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              {params.ministry && (
                <Link href={buildUrl({ ministry: undefined, page: undefined })}
                  className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors bg-gray-900 text-white border border-gray-900 flex items-center gap-1.5">
                  {params.ministry} <X className="w-3 h-3 opacity-70" />
                </Link>
              )}
              {ministryTypes.filter(m => m !== params.ministry).map((m) => (
                <Link key={m}
                  href={buildUrl({ ministry: m, page: undefined })}
                  className="flex-shrink-0 h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent flex items-center">
                  {m}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── GRID ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {total > 0 && pages > 1 && (
          <p className="text-xs text-gray-400 mb-4">
            Showing {showingFrom}–{showingTo} of {total.toLocaleString()}
          </p>
        )}

        {paginated.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-4">🎤</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No organizers found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {hasFilters ? 'Try a different search or filter' : 'Check back soon'}
            </p>
            {hasFilters && (
              <Link href="/organizers"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
                See all organizers
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {paginated.map((entry) => (
              <OrganizerProfileCard
                key={entry.id}
                id={entry.id}
                slug={entry.slug}
                name={entry.name}
                avatarUrl={entry.avatarUrl}
                description={entry.description}
                eventCount={entry.eventCount}
                isVerified={entry.isVerified}
                isClaimed={entry.isClaimed}
                ministryType={entry.ministryType}
                city={entry.city}
                state={entry.state}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">Page {page} of {pages}</p>
            <div className="flex gap-3">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  ← Previous
                </Link>
              )}
              {page < pages && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}

        <HaveAnEventCTA />
      </div>
    </div>
  )
}
