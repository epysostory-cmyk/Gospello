import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft, Repeat } from 'lucide-react'
import type { Event } from '@/types/database'

export const dynamic = 'force-dynamic'

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth']

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: series } = await admin
    .from('event_series')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!series) notFound()

  const { data: events } = await admin
    .from('events')
    .select('id, title, slug, start_date, end_date, city, state, banner_url, is_free, location_name, is_online, status')
    .eq('event_series_id', series.id)
    .eq('status', 'approved')
    .order('start_date', { ascending: true })

  const rule = series.recurrence_rule
  let recurrenceDesc = ''
  if (rule) {
    const freq = FREQ_LABEL[rule.frequency] ?? rule.frequency
    const interval = rule.interval > 1 ? `every ${rule.interval} ${rule.frequency === 'weekly' ? 'weeks' : 'months'}` : rule.frequency === 'weekly' ? 'weekly' : 'monthly'
    const dayName = DAYS[rule.day_of_week] ?? ''
    if (rule.frequency === 'monthly' && rule.week_of_month) {
      recurrenceDesc = `${ORDINALS[rule.week_of_month]} ${dayName} of each month`
    } else {
      recurrenceDesc = `${interval} on ${dayName}s`
    }
  }

  const now = new Date()
  const upcoming = (events ?? []).filter(e => new Date(e.start_date) >= now) as Event[]
  const past = (events ?? []).filter(e => new Date(e.start_date) < now) as Event[]

  const firstEvent = (events ?? [])[0] as (Event & { banner_url?: string | null }) | undefined

  return (
    <div className="min-h-screen bg-white font-outfit">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          All events
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          {firstEvent?.banner_url && (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src={firstEvent.banner_url} alt={series.title} fill className="object-cover" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Recurring Series</span>
            </div>
            <h1 className="text-2xl font-black text-gray-950">{series.title}</h1>
            {recurrenceDesc && (
              <p className="text-sm text-gray-500 mt-1">{recurrenceDesc}</p>
            )}
          </div>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Upcoming dates</h2>
            <div className="space-y-3">
              {upcoming.map(ev => (
                <EventRow key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Past dates</h2>
            <div className="space-y-3 opacity-60">
              {past.slice().reverse().map(ev => (
                <EventRow key={ev.id} event={ev} past />
              ))}
            </div>
          </section>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm">No events yet in this series.</p>
          </div>
        )}

      </div>
    </div>
  )
}

function EventRow({ event, past = false }: { event: Event; past?: boolean }) {
  const venue = event.is_online
    ? 'Online'
    : [event.location_name !== 'TBD' ? event.location_name : null, event.city].filter(Boolean).join(', ')

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`flex items-center gap-4 p-4 border rounded-2xl transition-all ${past ? 'border-gray-100 hover:border-gray-200' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}
    >
      {event.banner_url && (
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          {venue && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {venue}
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${event.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {event.is_free ? 'Free' : 'Paid'}
      </span>
    </Link>
  )
}
