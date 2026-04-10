import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime, CATEGORY_LABELS, CATEGORY_COLORS, cn } from '@/lib/utils'
import { Calendar, MapPin, Clock, ExternalLink, Building2, Tag, ArrowLeft } from 'lucide-react'
import type { Event } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('title, description').eq('slug', slug).single()
  if (!data) return {}
  return {
    title: data.title,
    description: data.description?.substring(0, 160),
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, churches(*), profiles(*)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!event) notFound()

  const e = event as Event

  // Fetch related events
  const { data: related } = await supabase
    .from('events')
    .select('id, title, slug, start_date, city, category, banner_url, location_name')
    .eq('status', 'approved')
    .eq('category', e.category)
    .neq('id', e.id)
    .gte('start_date', new Date().toISOString())
    .limit(3)

  const categoryColor = CATEGORY_COLORS[e.category] ?? 'bg-gray-100 text-gray-800'
  const categoryLabel = CATEGORY_LABELS[e.category] ?? e.category

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          {e.banner_url ? (
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden">
              <Image src={e.banner_url} alt={e.title} fill className="object-cover" priority />
            </div>
          ) : (
            <div className="w-full h-52 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <span className="text-6xl font-bold text-indigo-200">{e.title[0]}</span>
            </div>
          )}

          {/* Category + Title */}
          <div>
            <span className={cn('text-xs font-medium px-3 py-1 rounded-full', categoryColor)}>
              {categoryLabel}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mt-3 leading-tight">{e.title}</h1>
          </div>

          {/* Description */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{e.description}</p>
          </div>

          {/* Church attribution */}
          {e.churches && (
            <div className="bg-indigo-50 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Hosted by</h3>
              <Link
                href={`/churches/${e.churches.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  {e.churches.logo_url ? (
                    <Image src={e.churches.logo_url} alt={e.churches.name} width={40} height={40} className="rounded-full" />
                  ) : (
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {e.churches.name}
                  </p>
                  {e.churches.city && (
                    <p className="text-sm text-gray-500">{e.churches.city}</p>
                  )}
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Event details card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Event Details</h2>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{formatDate(e.start_date)}</p>
                {e.end_date && (
                  <p className="text-xs text-gray-500">Ends {formatDate(e.end_date)}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{formatTime(e.start_date)}</p>
                {e.end_date && (
                  <p className="text-xs text-gray-500">Ends {formatTime(e.end_date)}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{e.location_name}</p>
                {e.address && <p className="text-xs text-gray-500">{e.address}</p>}
                <p className="text-xs text-gray-500">{e.city}, {e.state}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', categoryColor)}>
                {categoryLabel}
              </span>
            </div>

            {e.is_free && (
              <div className="bg-green-50 text-green-700 text-sm font-medium text-center py-2 rounded-lg">
                🎉 Free Event
              </div>
            )}

            {/* CTA */}
            {e.external_link ? (
              <a
                href={e.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Register / Attend
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="w-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-semibold py-3 rounded-xl">
                Attend this Event
              </div>
            )}
          </div>

          {/* Share */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Share this Event</h3>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=Check out this event: ${e.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${e.title}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/events/${e.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Related events */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">More {categoryLabel} Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {(related as Event[]).map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all"
              >
                <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{ev.title}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(ev.start_date, { month: 'short', day: 'numeric' })} · {ev.city}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
