import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Search · Gospello' }
export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, MapPin, Building2, Users, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ q?: string; city?: string; tab?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', tab = 'all' } = await searchParams
  const query = q.trim()

  if (!query) {
    const admin = createAdminClient()
    const { data: categories } = await admin
      .from('categories')
      .select('name, slug, color')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .limit(12)

    const topics = categories ?? []

    return (
      <div className="min-h-screen bg-white">
        {/* Hero search area */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-4 pt-10 pb-14">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-black text-white mb-1">Find Your Next Event</h1>
            <p className="text-indigo-200 text-sm mb-6">Search gospel events, churches &amp; organizers</p>
            <form action="/search" method="GET">
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                <Search className="w-5 h-5 text-gray-400 my-auto ml-2 flex-shrink-0" />
                <input
                  name="q"
                  autoFocus
                  placeholder="Event name, church, city…"
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none py-2"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Browse by Topic */}
        {topics.length > 0 && (
          <div className="max-w-xl mx-auto px-4 -mt-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">Browse by Topic</p>
              <div className="flex flex-wrap gap-2">
                {topics.map(({ name, slug, color }) => (
                  <Link
                    key={slug}
                    href={`/events?category=${slug}`}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
                    style={{
                      backgroundColor: (color ?? '#6B7280') + '18',
                      color: color ?? '#6B7280',
                      border: `1px solid ${(color ?? '#6B7280')}30`,
                    }}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto px-4 mt-6 pb-10">
          <p className="text-xs text-gray-400 text-center">Gospello — Nigeria&apos;s gospel event directory</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()
  const like = `%${query}%`

  const [eventsRes, churchesRes, organizersRes] = await Promise.all([
    admin
      .from('events')
      .select('id, title, slug, start_date, city, state, category, banner_url, is_free, location_name')
      .eq('status', 'approved')
      .or(`title.ilike.${like},description.ilike.${like},city.ilike.${like},location_name.ilike.${like}`)
      .order('start_date', { ascending: true })
      .limit(12),

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

  const events    = eventsRes.data ?? []
  const churches  = churchesRes.data ?? []
  const organizers = organizersRes.data ?? []
  const total = events.length + churches.length + organizers.length

  const activeTab = tab === 'events' ? 'events' : tab === 'churches' ? 'churches' : tab === 'organizers' ? 'organizers' : 'all'

  const showEvents    = activeTab === 'all' || activeTab === 'events'
  const showChurches  = activeTab === 'all' || activeTab === 'churches'
  const showOrganizers = activeTab === 'all' || activeTab === 'organizers'

  const tabCls = (t: string) =>
    `px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
      activeTab === t
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search + tabs header */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
          <form action="/search" method="GET" className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search events, churches, organizers…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              {/* carry active tab */}
              {activeTab !== 'all' && <input type="hidden" name="tab" value={activeTab} />}
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              Go
            </button>
          </form>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <Link href={`/search?q=${encodeURIComponent(query)}&tab=all`} className={tabCls('all')}>
              All {total > 0 && <span className="ml-1 opacity-70">({total})</span>}
            </Link>
            {events.length > 0 && (
              <Link href={`/search?q=${encodeURIComponent(query)}&tab=events`} className={tabCls('events')}>
                Events ({events.length})
              </Link>
            )}
            {churches.length > 0 && (
              <Link href={`/search?q=${encodeURIComponent(query)}&tab=churches`} className={tabCls('churches')}>
                Churches ({churches.length})
              </Link>
            )}
            {organizers.length > 0 && (
              <Link href={`/search?q=${encodeURIComponent(query)}&tab=organizers`} className={tabCls('organizers')}>
                Organizers ({organizers.length})
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {total === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-gray-500 mb-5">Try a different spelling, city name, or event type.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Concerts', 'Conferences', 'Crusades', 'Youth'].map(label => (
                <Link
                  key={label}
                  href={`/search?q=${encodeURIComponent(label.toLowerCase())}`}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {showEvents && events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Events</h2>
              <Link
                href={`/events?q=${encodeURIComponent(query)}`}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                See all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="group flex gap-3.5 bg-white rounded-2xl border border-gray-100 p-3 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {ev.banner_url
                      ? <Image src={ev.banner_url} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-black">{ev.title[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">{ev.title}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {formatDate(ev.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {ev.city && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{ev.city}</span>
                        </p>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ev.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {ev.is_free ? 'FREE' : 'PAID'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Churches */}
        {showChurches && churches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Churches</h2>
              <Link href="/churches" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {churches.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/churches/${ch.slug}`}
                  className="group flex gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ch.logo_url
                      ? <Image src={ch.logo_url} alt={ch.name} width={48} height={48} className="object-cover" />
                      : <Building2 className="w-5 h-5 text-indigo-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">{ch.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ch.city}, {ch.state}</p>
                    {ch.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ch.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Organizers */}
        {showOrganizers && organizers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Organizers</h2>
              <Link href="/organizers" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {organizers.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizers/${org.id}`}
                  className="group flex gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
                    {org.avatar_url
                      ? <Image src={org.avatar_url} alt={org.display_name} width={48} height={48} className="object-cover rounded-full" />
                      : <span className="font-black text-indigo-600 text-lg">{org.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">{org.display_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
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
