import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Clock, Globe, Phone, CheckCircle, ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
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

const BANNER_GRADIENTS: Record<number, string> = {
  0: 'from-violet-700 via-indigo-900 to-slate-900',
  1: 'from-blue-700 via-cyan-900 to-slate-900',
  2: 'from-emerald-700 via-teal-900 to-slate-900',
  3: 'from-amber-600 via-orange-900 to-slate-900',
  4: 'from-pink-700 via-rose-900 to-slate-900',
  5: 'from-indigo-700 via-purple-900 to-slate-900',
}

export default async function ChurchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: church } = await supabase.from('churches').select('*').eq('slug', slug).single()
  if (!church) notFound()

  const c = church as Church

  const { data: eventsData } = await supabase
    .from('events')
    .select('*, churches(*)')
    .eq('church_id', c.id)
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(6)

  const events = (eventsData ?? []) as Event[]

  const gradientKey = (c.name.charCodeAt(0) ?? 0) % 6
  const bannerGradient = BANNER_GRADIENTS[gradientKey]
  const initial = c.name[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── FULL-WIDTH HERO ─────────────────────────────────────── */}
      <div className={`relative w-full min-h-[280px] max-h-[480px] overflow-hidden bg-slate-900`}>
        {c.banner_url ? (
          <>
            <Image
              src={c.banner_url}
              alt=""
              fill
              className="object-cover scale-110 blur-2xl opacity-20 pointer-events-none select-none"
              aria-hidden
              priority
            />
            <Image
              src={c.banner_url}
              alt={c.name}
              fill
              className="object-cover"
              priority
            />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${bannerGradient}`}>
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

        {/* Back button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link
            href="/churches"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Churches
          </Link>
        </div>

        {/* Church name + info at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 pt-20">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-white/20 bg-white/10 backdrop-blur-sm overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xl">
              {c.logo_url ? (
                <Image src={c.logo_url} alt={c.name} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white font-black text-3xl drop-shadow">{initial}</span>
              )}
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {c.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-indigo-500/80 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
                {c.is_featured && (
                  <span className="text-xs font-semibold bg-amber-500/90 text-white px-2.5 py-1 rounded-full">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm">
                {c.name}
              </h1>
              <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                {c.city}, {c.state}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: description + events */}
          <div className="lg:col-span-2 space-y-6">
            {c.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">About {c.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {c.description}
                </p>
              </div>
            )}

            {/* Upcoming events */}
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-4">Upcoming Events</h2>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
                  <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No upcoming events</p>
                  <p className="text-gray-400 text-xs mt-1">Check back soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: sidebar info */}
          <div className="lg:sticky lg:top-6 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
              <h2 className="font-bold text-gray-900">Church Info</h2>

              {c.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.address}</p>
                    <p className="text-xs text-gray-500">{c.city}, {c.state}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${c.address} ${c.city} ${c.state}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <MapPin className="w-2.5 h-2.5" /> Open in Maps
                    </a>
                  </div>
                </div>
              )}

              {c.service_times && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Service Times</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{c.service_times}</p>
                  </div>
                </div>
              )}

              {c.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-emerald-500" />
                  </div>
                  <a href={`tel:${c.phone}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    {c.phone}
                  </a>
                </div>
              )}

              {c.website_url && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-sky-500" />
                  </div>
                  <a
                    href={c.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
