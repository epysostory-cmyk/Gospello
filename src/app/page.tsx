import Link from 'next/link'
import { Search, ArrowRight, MapPin, ChevronRight } from 'lucide-react'
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

export const revalidate = 60

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

async function getHomepageData() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const now = new Date().toISOString()
    const in90Days = new Date(Date.now() + NINETY_DAYS).toISOString()

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
        .eq('is_featured', true)
        .gte('start_date', now)
        .or(`featured_until.is.null,featured_until.gte.${now}`)
        .order('start_date', { ascending: true })
        .limit(4),
      supabase
        .from('events')
        .select('*, churches(*)')
        .eq('status', 'approved')
        .order('start_date', { ascending: false })
        .limit(20),
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
        .order('sort_order', { ascending: true })
        .limit(6),
      // Church IDs that have at least one approved event
      adminClient
        .from('events')
        .select('organizer_id')
        .eq('status', 'approved')
        .not('organizer_id', 'is', null),
      // Discover Organizers — from profiles
      adminClient
        .from('profiles')
        .select('id, display_name, avatar_url, state, ministry_type')
        .eq('account_type', 'organizer')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20),
      // Discover Organizers — from seeded_organizers
      adminClient
        .from('seeded_organizers')
        .select('id, name, slug, logo_url, ministry_type, city, state, verified_badge')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20),
      // Homepage church CTA settings
      adminClient
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_church_cta')
        .maybeSingle(),
    ])

    const featuredEvents = (featuredRes.data ?? []) as Event[]

    // Sort: upcoming events first (soonest first), then ended events (most recently ended first)
    const nowMs = Date.now()
    const upcomingEvents = ((upcomingRes.data ?? []) as Event[]).sort((a, b) => {
      const aEnded = new Date(a.start_date).getTime() < nowMs
      const bEnded = new Date(b.start_date).getTime() < nowMs
      if (!aEnded && !bEnded) return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      if (aEnded && bEnded) return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      return aEnded ? 1 : -1
    })

    // Batch fetch attendance counts for all events shown on homepage
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

    // Count distinct cities where approved events are held
    const uniqueCities = new Set(
      (statsCitiesRes.data ?? []).map((r: { city: string }) => r.city?.trim().toLowerCase()).filter(Boolean)
    ).size

    const rawCategories = categoriesRes.data ?? []
    const catMap = Object.fromEntries(
      rawCategories.map(c => [c.slug, { name: c.name, icon: c.icon ?? null, color: c.color ?? '#6B7280' }])
    )

    // IDs of churches/organizers with at least one approved event
    const approvedOrganizerIds = new Set(
      (eventOrganizerIdsRes.data ?? []).map((r: { organizer_id: string }) => r.organizer_id).filter(Boolean)
    )

    // Fetch churches that have approved events
    const discoverChurches = approvedOrganizerIds.size > 0
      ? await adminClient
          .from('churches')
          .select('id, name, slug, logo_url, denomination, city, state, verified_badge')
          .eq('is_hidden', false)
          .in('id', [...approvedOrganizerIds])
          .order('verified_badge', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10)
          .then(r => (r.data ?? []).map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            logo_url: c.logo_url,
            denomination: c.denomination ?? null,
            city: c.city ?? '',
            state: c.state ?? '',
            verified_badge: c.verified_badge ?? false,
          })))
      : []

    // Build discover organizers list (merge profiles + seeded, limit to 10)
    const profileOrgs: OrganizerCard[] = (discoverProfileOrganizersRes.data ?? []).map((p: { id: string; display_name: string; avatar_url: string | null; state: string | null; ministry_type?: string | null }) => ({
      id: p.id,
      name: p.display_name,
      slug: p.id,
      logo_url: p.avatar_url,
      ministry_type: (p as { ministry_type?: string | null }).ministry_type ?? null,
      city: '',
      state: p.state ?? '',
      verified_badge: false,
      source: 'profile' as const,
    }))
    const seededOrgs: OrganizerCard[] = (discoverSeededOrganizersRes.data ?? []).map((s: { id: string; name: string; slug: string; logo_url: string | null; ministry_type: string | null; city: string; state: string; verified_badge: boolean }) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo_url: s.logo_url,
      ministry_type: s.ministry_type,
      city: s.city ?? '',
      state: s.state ?? '',
      verified_badge: s.verified_badge ?? false,
      source: 'seeded' as const,
    }))
    // Merge: only show organizers with at least one approved event, limit 10
    const allOrgs: OrganizerCard[] = [...profileOrgs, ...seededOrgs]
      .filter(o => approvedOrganizerIds.has(o.id))
      .slice(0, 10)

    // Homepage CTA settings
    const rawCta = churchCtaRes?.data?.value
    type CtaShape = { heading: string; subtext: string; button1_label: string; button1_url: string; button2_label: string; button2_url: string; visible: boolean }
    let churchCta: CtaShape | null = null
    if (rawCta) {
      const parsed: unknown = typeof rawCta === 'string' ? (() => { try { return JSON.parse(rawCta) } catch { return null } })() : rawCta
      if (parsed && typeof parsed === 'object') churchCta = parsed as CtaShape
    }

    return {
      featuredEvents,
      upcomingEvents,
      featuredChurches: (churchesRes.data ?? []) as Church[],
      categories: rawCategories,
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
    categories,
    catMap,
    stats,
    heroSettings,
    attendanceCountMap,
    discoverChurches,
    discoverOrganizers,
    churchCta,
  } = await getHomepageData()

  const heroBadge        = heroSettings?.hero_badge             ?? "Nigeria's Gospel Event Platform"
  const heroLine1        = heroSettings?.hero_headline_1        ?? 'Discover Every'
  const heroGradient     = heroSettings?.hero_headline_gradient ?? 'Gospel Event'
  const heroLine3        = heroSettings?.hero_headline_3        ?? 'Near You'
  const heroSubheadline  = heroSettings?.hero_subheadline       ?? 'Worship nights, conferences, prayer gatherings, youth programs and more — across all 36 Nigerian states and beyond.'
  const heroCtaPrimary   = heroSettings?.hero_cta_primary       ?? 'Explore Events'
  const heroCtaSecondary = heroSettings?.hero_cta_secondary     ?? 'Post an Event'
  const popularSearches: string[] = (heroSettings?.hero_popular_searches ?? 'Worship,Lagos,Conference,Prayer,Youth')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-purple-700/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[90px] -translate-y-1/2" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-4xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 text-sm px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-slate-300 font-medium">{heroBadge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-black leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              <span className="block text-4xl sm:text-6xl md:text-7xl text-white">{heroLine1}</span>
              <span className="block text-4xl sm:text-6xl md:text-7xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent whitespace-nowrap">
                {heroGradient}
              </span>
              <span className="block text-4xl sm:text-6xl md:text-7xl text-slate-300">{heroLine3}</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              {heroSubheadline}
            </p>

            {/* Search card */}
            <div className="mt-10 max-w-2xl">
              <form
                action="/search"
                method="GET"
                className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-[0_0_60px_rgba(99,102,241,0.3)]"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search events, churches, organizers..."
                    className="w-full pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                  />
                </div>
                <div className="hidden sm:flex items-center border-l border-gray-200 pl-2 pr-1">
                  <MapPin className="w-4 h-4 text-gray-400 ml-2 mr-1 flex-shrink-0" />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    className="w-24 py-3.5 pr-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Search
                </button>
              </form>

              {/* Popular searches */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-slate-600">Popular:</span>
                {popularSearches.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${tag}`}
                    className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-colors border border-white/10"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 text-sm"
              >
                {heroCtaPrimary}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors border border-white/10 backdrop-blur-sm text-sm"
              >
                {heroCtaSecondary}
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:gap-12">
              {[
                { value: stats.events > 0 ? `${stats.events}+` : '—',     label: 'Events created' },
                { value: stats.churches > 0 ? `${stats.churches}+` : '—', label: 'Churches' },
                { value: stats.cities > 0 ? `${stats.cities}+` : '36',    label: 'Cities covered' },
                { value: stats.organizers > 0 ? `${stats.organizers}+` : '—', label: 'Organizers' },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section className="py-16">
        {/* Header — no "View all" link; button below handles navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse by Category</h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Find events that match your spiritual interests</p>
        </div>

        {/* ── MOBILE: swipe carousel (2.5 visible) ── */}
        <div
          className="
            md:hidden
            flex gap-3 overflow-x-auto
            pl-4 pr-4 pb-2
            snap-x snap-mandatory
            [-webkit-overflow-scrolling:touch]
          "
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/events?category=${cat.slug}`}
              className="flex-shrink-0 snap-start"
              style={{
                width: 'calc(40% - 6px)',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className="
                  h-[100px] rounded-2xl bg-white border border-gray-100 p-4
                  flex flex-col items-center justify-center gap-2
                  active:scale-[0.97] transition-transform duration-150
                  animate-fadeInUp
                "
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  borderLeft: `3px solid ${cat.color ?? '#6B7280'}`,
                }}
              >
                <span className="text-3xl leading-none">{cat.icon}</span>
                <span className="text-[13px] font-semibold text-gray-900 text-center leading-tight line-clamp-1 w-full">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── DESKTOP: 6-column static grid ── */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/events?category=${cat.slug}`}
              className="group animate-fadeInUp"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="
                  h-[120px] rounded-2xl bg-white border border-gray-100 p-5
                  flex flex-col items-center justify-center gap-2.5
                  hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                "
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  borderLeft: `3px solid ${cat.color ?? '#6B7280'}`,
                }}
              >
                <span className="text-4xl leading-none">{cat.icon}</span>
                <span className="text-sm font-semibold text-gray-900 text-center leading-tight line-clamp-2 w-full">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* See More button — below carousel on all sizes */}
        <div className="flex justify-center mt-6 px-4 md:px-0">
          <Link
            href="/categories"
            className="
              w-full md:w-auto
              flex items-center justify-center gap-2
              h-12 px-8 rounded-xl
              bg-white border-[1.5px] border-gray-200
              text-sm font-semibold text-gray-700
              hover:bg-gray-50 hover:border-gray-300 transition-colors
            "
          >
            See all categories
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </Link>
        </div>
      </section>

      {/* ── DISCOVER CHURCHES ────────────────────────────────────── */}
      <DiscoverChurches churches={discoverChurches} />

      {/* ── DISCOVER ORGANIZERS ──────────────────────────────────── */}
      <DiscoverOrganizers organizers={discoverOrganizers} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">

        {/* ── FEATURED EVENTS ────────────────────────────────────── */}
        {featuredEvents.length > 0 && (
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
        )}

        {/* ── UPCOMING EVENTS (location-aware) ──────────────────── */}
        {upcomingEvents.length > 0 && (
          <LocationAwareEvents
            allEvents={upcomingEvents}
            attendanceCountMap={attendanceCountMap}
            catMap={catMap}
          />
        )}

        {/* Empty state */}
        {featuredEvents.length === 0 && upcomingEvents.length === 0 && (
          <section className="text-center py-20">
            <div className="text-6xl mb-4">⛪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Events coming soon</h2>
            <p className="text-gray-500 mb-8">Be the first to post an event on Gospello.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Post an Event
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        {/* ── FEATURED CHURCHES ──────────────────────────────────── */}
        {featuredChurches.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Churches"
              subtitle="Connect with vibrant churches across Nigeria"
              href="/churches"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredChurches.map((church) => (
                <ChurchCard key={church.id} church={church} />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA BANNER ─────────────────────────────────────────── */}
        {(churchCta === null || churchCta.visible !== false) && (
          <section className="relative bg-slate-950 rounded-3xl p-10 md:p-16 text-white overflow-hidden text-center">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                {churchCta?.heading
                  ? <span>{churchCta.heading.replace('Gospello', '').trim().replace(/\?$/, '')}{' '}
                      <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Gospello?</span>
                    </span>
                  : <>Is your church on{' '}<span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Gospello?</span></>
                }
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                {churchCta?.subtext ?? 'Join churches and organizers reaching more believers by listing your events for free.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={churchCta?.button1_url ?? '/auth/signup?type=church'}
                  className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-8 py-3.5 rounded-xl transition-colors"
                >
                  {churchCta?.button1_label ?? 'Register Your Church'}
                </Link>
                <Link
                  href={churchCta?.button2_url ?? '/auth/signup'}
                  className="bg-white/8 hover:bg-white/12 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors border border-white/10"
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
