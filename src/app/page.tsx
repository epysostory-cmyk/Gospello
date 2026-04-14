import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/ui/EventCard'
import ChurchCard from '@/components/ui/ChurchCard'
import SectionHeader from '@/components/ui/SectionHeader'
import type { Event, Church } from '@/types/database'

export const revalidate = 60

const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000

async function getHomepageData() {
  try {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const in60Days = new Date(Date.now() + SIXTY_DAYS).toISOString()

    const [featuredRes, upcomingRes, churchesRes] = await Promise.all([
      // Featured: must be featured, upcoming, and either no expiry or not expired
      supabase
        .from('events')
        .select('*, churches(*)')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .gte('start_date', now)
        .or(`featured_until.is.null,featured_until.gte.${now}`)
        .order('start_date', { ascending: true })
        .limit(4),

      // All upcoming events within 60 days
      supabase
        .from('events')
        .select('*, churches(*)')
        .eq('status', 'approved')
        .gte('start_date', now)
        .lte('start_date', in60Days)
        .order('start_date', { ascending: true })
        .limit(12),

      supabase
        .from('churches')
        .select('*')
        .eq('is_featured', true)
        .limit(6),
    ])

    return {
      featuredEvents: (featuredRes.data ?? []) as Event[],
      upcomingEvents: (upcomingRes.data ?? []) as Event[],
      featuredChurches: (churchesRes.data ?? []) as Church[],
    }
  } catch {
    return { featuredEvents: [], upcomingEvents: [], featuredChurches: [] }
  }
}

const CATEGORIES = [
  { label: 'Concerts', value: 'worship', emoji: '🎵', gradient: 'from-purple-500 to-indigo-600' },
  { label: 'Conferences', value: 'conference', emoji: '🎤', gradient: 'from-blue-500 to-cyan-600' },
  { label: 'Worship Nights', value: 'worship', emoji: '🙏', gradient: 'from-indigo-500 to-purple-600' },
  { label: 'Trainings', value: 'training', emoji: '📖', gradient: 'from-green-500 to-teal-600' },
  { label: 'Prayer Events', value: 'prayer', emoji: '✨', gradient: 'from-amber-500 to-orange-600' },
  { label: 'Youth Programs', value: 'youth', emoji: '🌟', gradient: 'from-pink-500 to-rose-600' },
]

export default async function HomePage() {
  const { featuredEvents, upcomingEvents, featuredChurches } = await getHomepageData()

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Nigeria-wide · Globally accessible
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Discover Gospel Events<br />
              <span className="text-amber-400">Happening Near You</span>
            </h1>

            <p className="mt-6 text-lg text-indigo-200 max-w-xl leading-relaxed">
              Find Christian events, connect with churches, and plan your spiritual journey — all in one place.
            </p>

            {/* Search */}
            <form action="/events" method="GET" className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search events, churches, organizers..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow"
              >
                Explore Events
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Create Event
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionHeader
          title="Browse by Category"
          subtitle="Find events that match your spiritual interests"
          href="/categories"
          linkText="View all categories"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/events?category=${cat.value}`}
              className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl shadow-sm`}>
                {cat.emoji}
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16">

        {/* ── FEATURED EVENTS ──────────────────────────────────── */}
        {featuredEvents.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Events"
              subtitle="Hand-picked highlights — curated by our team"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING EVENTS ──────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <section>
            <SectionHeader
              title="Upcoming Events"
              subtitle="Gospel events happening in the next 60 days"
              href="/events"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                See all events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
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

        {/* ── FEATURED CHURCHES ────────────────────────────────── */}
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

        {/* ── CTA BANNER ───────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Is your church on Gospello?</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
            Join churches and organizers reaching more believers by listing your events for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup?type=church"
              className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Register Your Church
            </Link>
            <Link
              href="/auth/signup"
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Post an Event
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
