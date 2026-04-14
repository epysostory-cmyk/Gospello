import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import { Users, Calendar, MapPin, ArrowLeft } from 'lucide-react'
import type { Profile, Event } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('display_name').eq('id', id).single()
  if (!data) return {}
  return { title: `${data.display_name} | Gospello` }
}

export default async function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('account_type', 'organizer')
    .single()

  if (!profile) notFound()

  const organizer = profile as Profile

  const now = new Date().toISOString()

  const [upcomingRes, pastRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name, is_free, views_count')
      .eq('organizer_id', id)
      .eq('status', 'approved')
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(20),

    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name, is_free, views_count')
      .eq('organizer_id', id)
      .eq('status', 'approved')
      .lt('start_date', now)
      .order('start_date', { ascending: false })
      .limit(6),
  ])

  const upcoming = (upcomingRes.data ?? []) as Event[]
  const past = (pastRes.data ?? []) as Event[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/organizers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Organizers
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {organizer.avatar_url ? (
              <Image src={organizer.avatar_url} alt={organizer.display_name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <Users className="w-8 h-8 text-indigo-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organizer.display_name}</h1>
            <p className="text-gray-500 mt-1">Event Organizer</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-300">·</span>
              <span>Joined {formatDate(organizer.created_at, { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Upcoming Events
          {upcoming.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({upcoming.length})</span>}
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
            No upcoming events at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50">
                  {event.banner_url ? (
                    <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-indigo-200">{event.title[0]}</span>
                    </div>
                  )}
                  <span className={cn('absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full', CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-800')}>
                    {CATEGORY_LABELS[event.category]}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{event.title}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location_name}, {event.city}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past events */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Past Events
            <span className="ml-2 text-sm font-normal text-gray-400">({past.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {past.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all opacity-75 hover:opacity-100"
              >
                <div className="relative h-36 bg-gradient-to-br from-gray-50 to-gray-100">
                  {event.banner_url ? (
                    <Image src={event.banner_url} alt={event.title} fill className="object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-200">{event.title[0]}</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Ended</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-2">{event.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })} · {event.city}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
