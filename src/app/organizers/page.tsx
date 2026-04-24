import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Organizers' }

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile, SeededOrganizer } from '@/types/database'
import { Search, Calendar, Users, ShieldCheck, CheckCircle } from 'lucide-react'
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
  const now = new Date().toISOString()

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
  const allIds = [
    ...authOrganizers.map(o => ({ id: o.id, field: 'organizer_id' as const })),
    ...seededOrganizers.map(o => ({ id: o.id, field: 'seeded_organizer_id' as const })),
  ]

  const eventCountMap: Record<string, number> = {}

  if (authOrganizers.length > 0) {
    const { data: rows } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('status', 'approved')
      .gte('start_date', now)
      .in('organizer_id', authOrganizers.map(o => o.id))
    for (const r of rows ?? []) eventCountMap[r.organizer_id] = (eventCountMap[r.organizer_id] ?? 0) + 1
  }

  if (seededOrganizers.length > 0) {
    const { data: rows } = await supabase
      .from('events')
      .select('seeded_organizer_id')
      .eq('status', 'approved')
      .gte('start_date', now)
      .in('seeded_organizer_id', seededOrganizers.map(o => o.id))
    for (const r of rows ?? []) {
      if (r.seeded_organizer_id) eventCountMap[r.seeded_organizer_id] = (eventCountMap[r.seeded_organizer_id] ?? 0) + 1
    }
  }

  // Merge into one list with sort score: verified=3, claimed=2, pending=1, unclaimed=0
  let entries: OrganizerEntry[] = [
    ...authOrganizers.map(o => ({
      id: o.id,
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
    <div className="min-h-screen bg-gray-50">

      {/* ── DARK HERO ───────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-700/15 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="mb-7 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full mb-4 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              Gospel event organizers across Nigeria
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-white">Meet Our </span>
              <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Organizers</span>
            </h1>
            {total > 0 && (
              <p className="text-slate-400 mt-1.5 text-sm">
                {total} organizer{total !== 1 ? 's' : ''} hosting gospel events
                {params.q ? ` matching "${params.q}"` : ''}
              </p>
            )}
          </div>

          <form method="GET" action="/organizers" className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Search organizers..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 transition-colors"
              />
            </div>
            <button type="submit" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3.5 rounded-2xl transition-colors text-sm">
              Search
            </button>
            {params.q && (
              <Link href="/organizers" className="flex-shrink-0 flex items-center px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-medium transition-colors border border-white/10">
                Clear
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* ── ORGANIZER GRID ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paginated.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-5">🎤</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No organizers found</h3>
            <p className="text-gray-500 mb-6 text-sm">
              {params.q ? `No results for "${params.q}"` : 'Check back soon'}
            </p>
            {params.q && (
              <Link href="/organizers" className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {paginated.map((entry) => {
              const gradient = gradientForName(entry.name)
              const initial = entry.name?.[0]?.toUpperCase() ?? '?'
              const href = `/organizers/${entry.id}`

              return (
                <Link
                  key={entry.id}
                  href={href}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 transition-all duration-300"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <div className={`relative h-20 bg-gradient-to-br ${gradient}`}>
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '14px 14px',
                      }}
                    />
                    {entry.eventCount > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                        <Calendar className="w-2.5 h-2.5" />
                        {entry.eventCount}
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <div className="relative -mt-9 mb-3 flex items-end justify-between">
                      <div>
                        {entry.avatarUrl ? (
                          <Image
                            src={entry.avatarUrl}
                            alt={entry.name}
                            width={72}
                            height={72}
                            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover ring-4 ring-white shadow-md"
                          />
                        ) : (
                          <div className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center ring-4 ring-white shadow-md`}>
                            <span className="text-white font-black text-2xl drop-shadow-sm">{initial}</span>
                          </div>
                        )}
                      </div>
                      {/* Badge */}
                      <div className="mb-1">
                        {entry.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <ShieldCheck className="w-2.5 h-2.5" />Verified
                          </span>
                        ) : entry.isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle className="w-2.5 h-2.5" />Claimed
                          </span>
                        ) : entry.hasPendingClaim ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            Pending
                          </span>
                        ) : entry.isSeeded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm leading-tight line-clamp-2">
                      {entry.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {entry.eventCount > 0
                        ? `${entry.eventCount} upcoming event${entry.eventCount !== 1 ? 's' : ''}`
                        : 'Event organizer'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Previous
              </Link>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
            {page < pages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
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
