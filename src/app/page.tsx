import Link from 'next/link'
import { Search, ArrowRight, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EventCard from '@/components/ui/EventCard'
import ChurchCard from '@/components/ui/ChurchCard'
import SectionHeader from '@/components/ui/SectionHeader'
import LocationAwareEvents from './_components/LocationAwareEvents'
import DiscoverChurches from './_components/DiscoverChurches'
import DiscoverOrganizers from './_components/DiscoverOrganizers'
import type { OrganizerCard } from './_components/DiscoverOrganizers'
import type { Event, Church } from '@/types/database'
import HomeCategoryScroller from './_components/HomeCategoryScroller'

export const revalidate = 60

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

async function getHomepageData() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const in90Days = new Date(Date.now() + NINETY_DAYS).toISOString()
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

    const [
      heroSettingsRes,
      featuredRes,
      upcomingRes,
      churchesRes,
      statsEventsRes,
      statsChurchesRes,
      statsOrganizersRes,
      statsCitiesRes,
      categoriesRes,
      eventOrganizerIdsRes,
      discoverProfileOrganizersRes,
      discoverSeededOrganizersRes,
      churchCtaRes,
    ] = await Promise.all([
      supabase
        .from('platform_settings')
        .select('hero_badge, hero_headline_1, hero_headline_gradient, hero_headline_3, hero_subheadline, hero_popular_searches, hero_cta_primary, hero_cta_secondary')
        .eq('id', 'default')
        .single(),
      supabase
        .from('events')
        .select('*, churches(*)')
        .eq('status', 'approved')
        .eq('visibility', 'public')
        .eq('is_featured', true)
        .or(`end_date.gte.${now},and(end_date.is.null,start_date.gte.${threeHoursAgo})`)
        .or(`featured_until.is.null,featured_until.gte.${now}`)
        .order('start_date', { ascending: true })
        .limit(4),
      supabase
        .from('events')
        .select('*, churches(*)')
        .eq('status', 'approved')
        .eq('visibility', 'public')
        .or(`end_date.gte.${now},and(end_date.is.null,start_date.gte.${threeHoursAgo})`)
        .lte('start_date', in90Days)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('churches').select('*').eq('is_featured', true).limit(6),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      adminClient.from('churches').select('id', { count: 'exact', head: true }).eq('is_hidden', false),
      Promise.all([
        adminClient.from('seeded_organizers').select('id', { count: 'exact', head: true }).eq('is_hidden', false),
        adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'organizer').eq('is_hidden', false),
      ]),
      adminClient.from('events').select('city').eq('status', 'approved').not('city', 'is', null),
      adminClient
        .from('categories')
        .select('id, name, slug, icon, color')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
      adminClient
        .from('events')
        .select('organizer_id, church_id, seeded_organizer_id')
        .eq('status', 'approved'),
      adminClient
        .from('profiles')
        .select('id, display_name, avatar_url, state, ministry_type, bio')
        .eq('account_type', 'organizer')
        .neq('is_hidden', true)
        .order('created_at', { ascending: false })
        .limit(20),
      adminClient
        .from('seeded_organizers')
        .select('id, name, slug, logo_url, ministry_type, city, state, verified_badge, description')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20),
      adminClient
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_church_cta')
        .maybeSingle(),
    ])

    const featuredEvents = (featuredRes.data ?? []) as Event[]
    const upcomingEvents = (upcomingRes.data ?? []) as Event[]

    const allEventIds = [
      ...featuredEvents.map(e => e.id),
      ...upcomingEvents.map(e => e.id),
    ]

    let attendanceCountMap: Record<string, number> = {}
    if (allEventIds.length > 0) {
      const { data: attendanceRows } = await adminClient
        .from('attendances')
        .select('event_id')
        .in('event_id', allEventIds)
      for (const row of attendanceRows ?? []) {
        attendanceCountMap[row.event_id] = (attendanceCountMap[row.event_id] ?? 0) + 1
      }
    }

    const uniqueCities = new Set(
      (statsCitiesRes.data ?? []).map((r: { city: string }) => r.city?.trim().toLowerCase()).filter(Boolean)
    ).size

    const rawCategories = categoriesRes.data ?? []
    const catMap = Object.fromEntries(
      rawCategories.map(c => [c.slug, { name: c.name, icon: c.icon ?? null, color: c.color ?? '#6B7280' }])
    )

    const { data: categoryEventRows } = await adminClient
      .from('events')
      .select('category')
      .eq('status', 'approved')
      .not('category', 'is', null)
    const categoryEventCount: Record<string, number> = {}
    for (const row of categoryEventRows ?? []) {
      if (row.category) categoryEventCount[row.category] = (categoryEventCount[row.category] ?? 0) + 1
    }
    const categoriesWithEvents = rawCategories.filter(c => (categoryEventCount[c.slug] ?? 0) > 0)

    const approvedOrganizerIds = new Set(
      (eventOrganizerIdsRes.data ?? []).map((r: { organizer_id: string | null }) => r.organizer_id).filter(Boolean)
    )
    const approvedChurchIds = new Set(
      (eventOrganizerIdsRes.data ?? []).map((r: { church_id: string | null }) => r.church_id).filter(Boolean)
    )
    const approvedSeededOrgIds = new Set(
      (eventOrganizerIdsRes.data ?? []).map((r: { seeded_organizer_id?: string | null }) => r.seeded_organizer_id).filter(Boolean)
    )

    const allChurchesWithPhoto = await adminClient
      .from('churches')
      .select('id, name, slug, logo_url, denomination, city, state, verified_badge')
      .eq('is_hidden', false)
      .not('logo_url', 'is', null)
      .order('verified_badge', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)
      .then(r => r.data ?? [])

    const discoverChurches = [
      ...allChurchesWithPhoto.filter(c => approvedChurchIds.has(c.id)),
      ...allChurchesWithPhoto.filter(c => !approvedChurchIds.has(c.id)),
    ].slice(0, 10).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo_url: c.logo_url,
      denomination: c.denomination ?? null,
      city: c.city ?? '',
      state: c.state ?? '',
      verified_badge: c.verified_badge ?? false,
    }))

    const profileOrgs: OrganizerCard[] = (discoverProfileOrganizersRes.data ?? [])
      .filter((p: { avatar_url: string | null }) => !!p.avatar_url)
      .map((p: { id: string; display_name: string; avatar_url: string | null; state: string | null; ministry_type?: string | null; bio?: string | null }) => ({
        id: p.id,
        name: p.display_name,
        slug: p.id,
        logo_url: p.avatar_url,
        ministry_type: p.ministry_type ?? null,
        description: p.bio ?? null,
        city: '',
        state: p.state ?? '',
        verified_badge: false,
        source: 'profile' as const,
      }))
    const seededOrgs: OrganizerCard[] = (discoverSeededOrganizersRes.data ?? [])
      .filter((s: { logo_url: string | null }) => !!s.logo_url)
      .map((s: { id: string; name: string; slug: string; logo_url: string | null; ministry_type: string | null; city: string; state: string; verified_badge: boolean; description?: string | null }) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logo_url: s.logo_url,
        ministry_type: s.ministry_type,
        description: s.description ?? null,
        city: s.city ?? '',
        state: s.state ?? '',
        verified_badge: s.verified_badge ?? false,
        source: 'seeded' as const,
      }))

    const allOrgs: OrganizerCard[] = [
      ...profileOrgs.filter(o => approvedOrganizerIds.has(o.id)),
      ...seededOrgs.filter(o => approvedSeededOrgIds.has(o.id)),
      ...profileOrgs.filter(o => !approvedOrganizerIds.has(o.id)),
      ...seededOrgs.filter(o => !approvedSeededOrgIds.has(o.id)),
    ].slice(0, 10)

    const rawCta = churchCtaRes?.data?.value
    type CtaShape = { heading: string; subtext: string; button1_label: string; button1_url: string; button2_label: string; button2_url: string; visible: boolean }
    let churchCta: CtaShape | null = null
    if (rawCta) {
      const parsed: unknown = typeof rawCta === 'string' ? (() => { try { return JSON.parse(rawCta) } catch { return null } })() : rawCta
      if (parsed && typeof parsed === 'object') churchCta = parsed as CtaShape
    }

    const featuredChurches = (churchesRes.data ?? []) as Church[]

    let churchEventCountMap: Record<string, number> = {}
    if (featuredChurches.length > 0) {
      const { data: churchEventRows } = await adminClient
        .from('events')
        .select('church_id')
        .eq('status', 'approved')
        .in('church_id', featuredChurches.map(c => c.id))
      for (const row of churchEventRows ?? []) {
        if (row.church_id) churchEventCountMap[row.church_id] = (churchEventCountMap[row.church_id] ?? 0) + 1
      }
    }

    return {
      featuredEvents,
      upcomingEvents,
      featuredChurches,
      churchEventCountMap,
      categories: categoriesWithEvents,
      catMap,
      stats: {
        events: statsEventsRes.count ?? 0,
        churches: statsChurchesRes.count ?? 0,
        organizers: (statsOrganizersRes[0].count ?? 0) + (statsOrganizersRes[1].count ?? 0),
        cities: uniqueCities,
      },
      heroSettings: heroSettingsRes.data ?? null,
      attendanceCountMap,
      discoverChurches,
      discoverOrganizers: allOrgs,
      churchCta,
    }
  } catch {
    return {
      featuredEvents: [],
      upcomingEvents: [],
      featuredChurches: [],
      churchEventCountMap: {} as Record<string, number>,
      categories: [],
      catMap: {} as Record<string, { name: string; icon: string | null; color: string | null }>,
      stats: { events: 0, churches: 0, organizers: 0, cities: 0 },
      heroSettings: null,
      attendanceCountMap: {} as Record<string, number>,
      discoverChurches: [],
      discoverOrganizers: [],
      churchCta: null,
    }
  }
}

export default async function HomePage() {
  const {
    featuredEvents,
    upcomingEvents,
    featuredChurches,
    churchEventCountMap,
    categories,
    catMap,
    stats,
    heroSettings,
    attendanceCountMap,
    discoverChurches,
    discoverOrganizers,
    churchCta,
  } = await getHomepageData()

  const displayCategories = categories.slice(0, 8)

  const heroHeadline1 = heroSettings?.hero_headline_1 ?? 'Find gospel events'
  const heroHeadlineGradient = heroSettings?.hero_headline_gradient ?? 'near you'
  const heroHeadline3 = heroSettings?.hero_headline_3 ?? ''
  const heroSubheadline = heroSettings?.hero_subheadline ?? 'Worship nights, conferences, prayer gatherings, youth programs and more — across all 36 Nigerian states.'
  const heroBadge = heroSettings?.hero_badge ?? ''
  const popularSearches: string[] = (heroSettings?.hero_popular_searches ?? 'Worship,Lagos,Conference,Prayer,Youth')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)

  const hasEvents = featuredEvents.length > 0 || upcomingEvents.length > 0

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 font-outfit">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">

          {/* Context label */}
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-6 border border-gray-200 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            {heroBadge || 'Events · Churches · All 36 States'}
          </div>

          <h1 className="text-[2.75rem] sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.06]">
            {heroHeadline1}{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {heroHeadlineGradient}
            </span>
            {heroHeadline3 && <span> {heroHeadline3}</span>}
          </h1>

          <p className="mt-4 text-base sm:text-[17px] text-gray-500 leading-relaxed max-w-lg mx-auto">
            {heroSubheadline}
          </p>

          {/* Search */}
          <form action="/search" method="GET" className="mt-8 flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                placeholder="Search events, churches, cities..."
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors"
            >
              Search
            </button>
          </form>

          {/* Quick destinations + popular searches */}
          <div className="mt-4 flex items-center justify-center gap-x-3 gap-y-2 flex-wrap">
            <Link
              href="/events?date=weekend"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              This weekend
            </Link>
            <Link
              href="/churches"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              Find a church
            </Link>
            {popularSearches.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Organizer CTA */}
          <p className="mt-5 text-sm text-gray-400">
            Running an event?{' '}
            <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:underline">
              Post it free →
            </Link>
          </p>

        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────── */}
      {(stats.events > 0 || stats.churches > 0 || stats.cities > 0) && (
        <div className="border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-4 sm:gap-7 flex-wrap">
            {stats.events > 0 && (
              <span className="text-[13px] text-gray-400">
                <span className="font-semibold text-gray-700">{stats.events.toLocaleString()}+</span>{' '}events listed
              </span>
            )}
            {stats.churches > 0 && (
              <>
                <span className="text-gray-200 hidden sm:inline">·</span>
                <span className="text-[13px] text-gray-400">
                  <span className="font-semibold text-gray-700">{stats.churches.toLocaleString()}+</span>{' '}churches
                </span>
              </>
            )}
            {stats.cities > 0 && (
              <>
                <span className="text-gray-200 hidden sm:inline">·</span>
                <span className="text-[13px] text-gray-400">
                  <span className="font-semibold text-gray-700">{stats.cities}</span>{' '}cities covered
                </span>
              </>
            )}
            {stats.organizers > 0 && (
              <>
                <span className="text-gray-200 hidden sm:inline">·</span>
                <span className="text-[13px] text-gray-400">
                  <span className="font-semibold text-gray-700">{stats.organizers.toLocaleString()}+</span>{' '}organizers
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORY PILLS ────────────────────────────────────────────── */}
      {displayCategories.length > 0 && (
        <HomeCategoryScroller categories={displayCategories} />
      )}

      {/* ── FEATURED EVENTS ───────────────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <section>
            <SectionHeader
              title="Featured Events"
              subtitle="Hand-picked highlights — curated by our team"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="featured"
                  categoryInfo={catMap[event.category]}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── FIND A CHURCH ─────────────────────────────────────────────
          Positioned before the main events feed — someone new to a city
          will find this before they get lost scrolling events.
      ──────────────────────────────────────────────────────────────── */}
      <DiscoverChurches churches={discoverChurches} />

      {/* ── UPCOMING EVENTS ───────────────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <LocationAwareEvents
          allEvents={upcomingEvents}
          attendanceCountMap={attendanceCountMap}
          catMap={catMap}
          categories={categories}
        />
      )}

      {/* Empty state */}
      {!hasEvents && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <section className="text-center py-20">
            <p className="text-5xl mb-4">⛪</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Events coming soon</h2>
            <p className="text-gray-500 mb-8 text-sm">Be the first to post an event on Gospello.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
            >
              Post an Event
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      )}

      {/* ── ORGANIZERS ────────────────────────────────────────────────── */}
      <DiscoverOrganizers organizers={discoverOrganizers} />

      {/* ── BOTTOM SECTIONS ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">

        {/* Featured Churches grid */}
        {featuredChurches.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Churches"
              subtitle="Connect with vibrant churches across Nigeria"
              href="/churches"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredChurches.map((church) => (
                <ChurchCard key={church.id} church={church} eventCount={churchEventCountMap[church.id]} />
              ))}
            </div>
          </section>
        )}

        {/* Organizer / Church CTA */}
        {(churchCta === null || churchCta.visible !== false) && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl px-8 py-10 sm:px-12 sm:py-12">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {churchCta?.heading ?? 'Is your church putting on an event?'}
              </h2>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                {churchCta?.subtext ?? 'List it on Gospello for free. Reach more believers across Nigeria — no tech skills needed.'}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href={churchCta?.button1_url ?? '/auth/signup?type=church'}
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
                >
                  {churchCta?.button1_label ?? 'Register Your Church'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={churchCta?.button2_url ?? '/auth/signup'}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-7 py-3.5 rounded-xl border border-gray-200 text-sm transition-colors"
                >
                  {churchCta?.button2_label ?? 'Post an Event'}
                </Link>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
