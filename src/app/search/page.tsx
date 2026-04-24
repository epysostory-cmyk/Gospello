import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Search' }

export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, MapPin, Building2, Users, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ q?: string; city?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', city = '' } = await searchParams
  const query = q.trim()

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Search className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Gospello</h1>
        <p className="text-gray-500 text-sm">Search for events, churches, and organizers</p>
        <form action="/search" method="GET" className="mt-6 w-full max-w-md">
          <div className="flex gap-2">
            <input
              name="q"
              autoFocus
              placeholder="Search..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Search
            </button>
          </div>
        </form>
      </div>
    )
  }

  const admin = createAdminClient()
  const like = `%${query}%`

  // Run all three queries in parallel
  const [eventsRes, churchesRes, organizersRes] = await Promise.all([
    admin
      .from('events')
      .select('id, title, slug, start_date, city, state, category, banner_url, is_free, location_name')
      .eq('status', 'approved')
      .or(`title.ilike.${like},description.ilike.${like},city.ilike.${like},location_name.ilike.${like}`)
      .order('start_date', { ascending: true })
      .limit(10),

    admin
      .from('churches')
      .select('id, name, slug, city, state, logo_url, description')
      .eq('is_hidden', false)
      .or(`name.ilike.${like},city.ilike.${like},description.ilike.${like}`)
      .limit(6),

    admin
      .from('profiles')
      .select('id, display_name, avatar_url, account_type')
      .eq('account_type', 'organizer')
      .eq('is_hidden', false)
      .ilike('display_name', like)
      .limit(6),
  ])

  const events = eventsRes.data ?? []
  const churches = churchesRes.data ?? []
  const organizers = organizersRes.data ?? []
  const total = events.length + churches.length + organizers.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Search bar */}
        <form action="/search" method="GET" className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search events, churches, organizers..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Search
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-6">
          {total === 0 ? `No results for "${query}"` : `${total} result${total === 1 ? '' : 's'} for "${query}"`}
        </p>

        {total === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Try a different search term — church name, event title, or city.</p>
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Events</h2>
              <Link href={`/events?q=${encodeURIComponent(query)}`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                See all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {events.map((ev) => (
                <Link key={ev.id} href={`/events/${ev.slug}`}
                  className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="relative w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {ev.banner_url && <Image src={ev.banner_url} alt={ev.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ev.location_name ? `${ev.location_name}, ` : ''}{ev.city}
                    </p>
                  </div>
                  <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ev.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {ev.is_free ? 'Free' : 'Paid'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Churches */}
        {churches.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Churches</h2>
              <Link href="/churches" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {churches.map((ch) => (
                <Link key={ch.id} href={`/churches/${ch.slug}`}
                  className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ch.logo_url
                      ? <Image src={ch.logo_url} alt={ch.name} width={48} height={48} className="object-cover" />
                      : <Building2 className="w-5 h-5 text-indigo-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{ch.name}</p>
                    <p className="text-xs text-gray-500">{ch.city}, {ch.state}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Organizers */}
        {organizers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Organizers</h2>
              <Link href="/organizers" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {organizers.map((org) => (
                <Link key={org.id} href={`/organizers/${org.id}`}
                  className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {org.avatar_url
                      ? <Image src={org.avatar_url} alt={org.display_name} width={48} height={48} className="object-cover rounded-xl" />
                      : <span className="font-bold text-indigo-600 text-lg">{org.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{org.display_name}</p>
                    <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                      <Users className="w-3 h-3" /> Event Organizer
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
