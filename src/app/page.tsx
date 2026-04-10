import Link from 'next/link'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/ui/EventCard'
import ChurchCard from '@/components/ui/ChurchCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { isThisWeekend } from '@/lib/utils'
import type { Event, Church } from '@/types/database'

export const revalidate = 60

async function getHomepageData() {
  try {
  const supabase = await createClient()

  const [featuredEventsRes, thisWeekRes, churchesRes] = await Promise.all([
    supabase
      .from('events')
      .select('*, churches(*)')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(4),

    supabase
      .from('events')
      .select('*, churches(*)')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString())
      .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_date', { ascending: true })
      .limit(8),

    supabase
      .from('churches')
      .select('*')
      .eq('is_featured', true)
      .limit(6),
  ])

  const allThisWeek = (thisWeekRes.data ?? []) as Event[]
  const thisWeekend = allThisWeek.filter((e) => isThisWeekend(e.start_date))
  const thisWeek = allThisWeek.filter((e) => !isThisWeekend(e.start_date))

  return {
    featuredEvents: (featuredEventsRes.data ?? []) as Event[],
    thisWeekend,
    thisWeek,
    featuredChurches: (churchesRes.data ?? []) as Church[],
  }
  } catch {
    return { featuredEvents: [], thisWeekend: [], thisWeek: [], featuredChurches: [] }
  }
}

const CATEGORIES = [
  { label: 'Worship', value: 'worship', emoji: '🙏' },
  { label: 'Prayer', value: 'prayer', emoji: '✨' },
  { label: 'Conference', value: 'conference', emoji: '🎤' },
  { label: 'Youth', value: 'youth', emoji: '🌟' },
  { label: 'Training', value: 'training', emoji: '📖' },
  { label: 'Other', value: 'other', emoji: '⛪' },
]

export default async function HomePage() {
  const { featuredEvents, thisWeekend, thisWeek, featuredChurches } = await getHomepageData()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Lagos-first · Globally accessible
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Discover What God<br />
              <span className="text-amber-400">Is Doing Near You</span>
            </h1>

            <p className="mt-6 text-lg text-indigo-200 max-w-xl leading-relaxed">
              Find Christian events, connect with churches, and plan your spiritual journey — all in one place.
            </p>

            {/* Search Bar */}
            <form action="/events" method="GET" className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search events, churches, categories..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  defaultValue="Lagos"
                  placeholder="City"
                  className="w-full sm:w-40 pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg"
              >
                Search
              </button>
            </form>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-indigo-200">
              <span>🎯 Lagos-focused</span>
              <span>⛪ Churches &amp; Organizers</span>
              <span>📅 Updated daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            <Link
              href="/events"
              className="flex-shrink-0 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
            >
              All Events
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/events?category=${cat.value}`}
                className="flex-shrink-0 flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Events"
              subtitle="Hand-picked highlights from across Lagos"
              href="/events?featured=true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* This Weekend */}
        {thisWeekend.length > 0 && (
          <section>
            <SectionHeader
              title="This Weekend"
              subtitle="Events happening in the next 48–72 hours"
              href="/events?timeframe=weekend"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {thisWeekend.slice(0, 4).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* This Week */}
        {thisWeek.length > 0 && (
          <section>
            <SectionHeader
              title="This Week&apos;s Events"
              subtitle="Upcoming events you don&apos;t want to miss"
              href="/events?timeframe=week"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {thisWeek.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {featuredEvents.length === 0 && thisWeekend.length === 0 && thisWeek.length === 0 && (
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

        {/* Featured Churches */}
        {featuredChurches.length > 0 && (
          <section>
            <SectionHeader
              title="Featured Churches"
              subtitle="Vibrant churches across Lagos"
              href="/churches"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredChurches.map((church) => (
                <ChurchCard key={church.id} church={church} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Is your church on Gospello?</h2>
          <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
            Join hundreds of churches and organizers reaching more believers by listing your events for free.
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
