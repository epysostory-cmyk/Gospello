import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft, ExternalLink } from 'lucide-react'
import type { Profile, Event } from '@/types/database'
import EventCard from '@/components/ui/EventCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('display_name').eq('id', id).single()
  if (!data) return {}
  return { title: data.display_name }
}

const BANNER_GRADIENTS: Record<number, string> = {
  0: 'from-violet-700 via-indigo-800 to-slate-900',
  1: 'from-blue-700 via-cyan-800 to-slate-900',
  2: 'from-emerald-700 via-teal-800 to-slate-900',
  3: 'from-amber-600 via-orange-800 to-slate-900',
  4: 'from-pink-700 via-rose-800 to-slate-900',
  5: 'from-indigo-700 via-purple-800 to-slate-900',
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
      .select('*, churches(*)')
      .eq('organizer_id', id)
      .eq('status', 'approved')
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(12),
    supabase
      .from('events')
      .select('id, title, slug, start_date, city, category, banner_url, location_name, is_free')
      .eq('organizer_id', id)
      .eq('status', 'approved')
      .lt('start_date', now)
      .order('start_date', { ascending: false })
      .limit(6),
  ])

  const upcoming = (upcomingRes.data ?? []) as Event[]
  const past = (pastRes.data ?? []) as Event[]

  const gradientKey = (organizer.display_name?.charCodeAt(0) ?? 0) % 6
  const bannerGradient = BANNER_GRADIENTS[gradientKey]
  const initial = organizer.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className={`relative w-full bg-gradient-to-br ${bannerGradient} overflow-hidden`}>
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        {/* Back button */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          <Link
            href="/organizers"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Organizers
          </Link>
        </div>

        {/* Profile content */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {organizer.avatar_url ? (
                <Image
                  src={organizer.avatar_url}
                  alt={organizer.display_name}
                  width={96}
                  height={96}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                  <span className="text-white font-black text-4xl drop-shadow">{initial}</span>
                </div>
              )}
            </div>

            {/* Name + stats */}
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90 backdrop-blur-sm">
                  Event Organizer
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
                {organizer.display_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-white/70">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}
                </span>
                {past.length > 0 && (
                  <span className="flex items-center gap-1.5 text-white/50">
                    {past.length} past event{past.length !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-white/40">
                  Since {formatDate(organizer.created_at, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">Upcoming Events</h2>
              {upcoming.length > 0 && (
                <p className="text-sm text-gray-400 mt-0.5">{upcoming.length} event{upcoming.length !== 1 ? 's' : ''} coming up</p>
              )}
            </div>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500 text-sm">No upcoming events at the moment</p>
              <p className="text-gray-400 text-xs mt-1">Check back soon</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-5">Past Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group flex gap-3 bg-white rounded-2xl border border-gray-100 p-3 hover:border-indigo-100 hover:shadow-sm transition-all"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">
                    {event.banner_url ? (
                      <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl font-bold">
                        {event.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(event.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {event.city && (
                      <p className="text-xs text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{event.city}
                      </p>
                    )}
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
