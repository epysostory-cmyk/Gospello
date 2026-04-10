import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatTime } from '@/lib/utils'
import { MapPin, Clock, Globe, Phone, CheckCircle, ArrowLeft, Calendar } from 'lucide-react'
import EventCard from '@/components/ui/EventCard'
import type { Church, Event } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('churches').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.name, description: data.description?.substring(0, 160) }
}

export default async function ChurchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: church } = await supabase
    .from('churches')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!church) notFound()

  const c = church as Church

  // Upcoming events for this church
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('church_id', c.id)
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(6)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/churches" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Churches
      </Link>

      {/* Banner */}
      <div className="relative w-full h-52 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
        {c.banner_url && (
          <Image src={c.banner_url} alt={c.name} fill className="object-cover" priority />
        )}
        {/* Logo overlay */}
        <div className="absolute bottom-4 left-6">
          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
            {c.logo_url ? (
              <Image src={c.logo_url} alt={c.name} width={80} height={80} className="object-cover" />
            ) : (
              <span className="text-2xl font-bold text-indigo-400">{c.name[0]}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{c.name}</h1>
              {c.is_verified && (
                <CheckCircle className="w-6 h-6 text-indigo-500" aria-label="Verified" />
              )}
            </div>
            <p className="text-gray-500 mt-1">{c.city}, {c.state}, {c.country}</p>
          </div>

          {c.description && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{c.description}</p>
            </div>
          )}

          {/* Upcoming events */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
            {events && events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(events as Event[]).map((event) => (
                  <EventCard key={event.id} event={event} variant="compact" />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No upcoming events from this church</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Church Info</h2>

            {c.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.address}</p>
                  <p className="text-xs text-gray-500">{c.city}, {c.state}</p>
                </div>
              </div>
            )}

            {c.service_times && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">Service Times</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{c.service_times}</p>
                </div>
              </div>
            )}

            {c.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <a href={`tel:${c.phone}`} className="text-sm text-indigo-600 hover:underline">{c.phone}</a>
              </div>
            )}

            {c.website_url && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline truncate">
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
