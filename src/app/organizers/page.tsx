import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Organizers' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, SeededOrganizer } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import { Search, ShieldCheck, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'

interface SearchParams {
  q?: string
  page?: string
}

const PAGE_SIZE = 24

const AVATAR_GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-pink-600 to-rose-700',
  'from-indigo-600 to-purple-700',
]

function gradientForName(name: string) {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}

interface OrganizerEntry {
  id: string
  slug: string
  name: string
  avatarUrl: string | null
  eventCount: number
  isSeeded: boolean
  isClaimed: boolean
  isVerified: boolean
  hasPendingClaim: boolean
  sortScore: number
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

  // Batch event counts
  const eventCountMap: Record<string, number> = {}

  if (authOrganizers.length > 0) {
    // Match the profile page filter: organizer_id match + no seeded_organizer_id (excludes admin-seeded events)
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

  // Merge into one list with sort score: verified=3, claimed=2, pending=1, unclaimed=0
  let entries: OrganizerEntry[] = [
    ...authOrganizers.map(o => ({
      id: o.id,
      slug: o.id, // auth organizers use id in URL
      name: o.display_name,
      avatarUrl: o.avatar_url,
      eventCount: eventCountMap[o.id] ?? 0,
      isSeeded: false,
      isClaimed: true,
      isVerified: false,
      hasPendingClaim: false,
      sortScore: 2,
    })),
    ...seededOrganizers.map(o => ({
      id: o.id,
      slug: o.slug, // seeded organizers use slug in URL
      name: o.name,
      avatarUrl: o.logo_url,
      eventCount: eventCountMap[o.id] ?? 0,
      isSeeded: true,
      isClaimed: o.is_claimed,
      isVerified: o.verified_badge,
      hasPendingClaim: !!o.claim_requested_at,
      sortScore: o.verified_badge ? 3 : o.is_claimed ? 2 : o.claim_requested_at ? 1 : 0,
    })),
  ]

  // Filter by search
  if (params.q) {
    const q = params.q.toLowerCase()
    entries = entries.filter(e => e.name.toLowerCase().includes(q))
  }

  // Sort: score desc, then name asc
  entries.sort((a, b) => b.sortScore - a.sortScore || a.name.localeCompare(b.name))

  const total = entries.length
  const page = parseInt(params.page ?? '1', 10)
  const pages = Math.ceil(total / PAGE_SIZE)
  const paginated = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = { ...params, ...overrides }
    const qs = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
    return `/organizers?${qs.toString()}`
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Directory</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Gospel event organizers
            </h1>
            <p className="text-gray-500 mt-2 text-base max-w-lg">
              Browse churches, ministries, and event hosts putting on gospel events across Nigeria. Click any to see their upcoming programmes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <form method="GET" action="/organizers" className="flex gap-2 w-full sm:max-w-md">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search by name…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button type="submit" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
                Search
              </button>
              {params.q && (
                <Link href="/organizers" className="flex-shrink-0 flex items-center px-3 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Clear
                </Link>
              )}
            </form>

            {total > 0 && (
              <p className="text-sm text-gray-400 whitespace-nowrap">
                {total} organizer{total !== 1 ? 's' : ''}
                {params.q ? ` for "${params.q}"` : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── ORGANIZER GRID ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paginated.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎤</p>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No organizers found</h3>
            <p className="text-gray-500 text-sm mb-5">
              {params.q ? `No results for "${params.q}"` : 'Check back soon'}
            </p>
            {params.q && (
              <Link href="/organizers" className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors">
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {paginated.map((entry) => {
              const gradient = gradientForName(entry.name)
              const initial = entry.name?.[0]?.toUpperCase() ?? '?'
              const href = `/organizers/${entry.slug}`

              return (
                <Link
                  key={entry.id}
                  href={href}
                  className="group bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  {/* Avatar row */}
                  <div className="flex items-center justify-between">
                    {entry.avatarUrl ? (
                      <Image
                        src={entry.avatarUrl}
                        alt={entry.name}
                        width={48}
                        height={48}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-lg">{initial}</span>
                      </div>
                    )}

                    {entry.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        <ShieldCheck className="w-2.5 h-2.5" />Verified
                      </span>
                    ) : entry.isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle className="w-2.5 h-2.5" />Active
                      </span>
                    ) : null}
                  </div>

                  {/* Name + event count */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                      {entry.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {entry.eventCount > 0
                        ? `${entry.eventCount} upcoming event${entry.eventCount !== 1 ? 's' : ''}`
                        : 'No upcoming events'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                ← Previous
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Next →
              </Link>
            )}
          </div>
        )}

        <HaveAnEventCTA />
      </div>
    </div>
  )
}
