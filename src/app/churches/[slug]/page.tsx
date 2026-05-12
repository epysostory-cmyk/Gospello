import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MapPin, Clock, Globe, Phone, CheckCircle, ArrowLeft, Calendar, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react'
import EventCard from '@/components/ui/EventCard'
import type { Church, Event } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const supabase = await createClient()
  const { data } = await supabase.from('churches').select('name, description, logo_url, city, state').eq('slug', slug).maybeSingle()
  if (!data) return {}

  const description = data.description
    ? data.description.slice(0, 160)
    : `Discover events by ${data.name}${data.city ? ` in ${data.city}` : ''} on Gospello.`
  const pageUrl = `${siteUrl}/churches/${slug}`

  return {
    title: data.name,
    description,
    openGraph: {
      title: `${data.name} | Gospello`,
      description,
      url: pageUrl,
      type: 'profile',
      siteName: 'Gospello',
      images: data.logo_url ? [{ url: data.logo_url, width: 400, height: 400, alt: data.name }] : [],
    },
    twitter: {
      card: 'summary',
      site: '@gospello',
      title: `${data.name} | Gospello`,
      description,
      images: data.logo_url ? [data.logo_url] : [],
    },
  }
}

export default async function ChurchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: church } = await supabase.from('churches').select('*').eq('slug', slug).eq('is_hidden', false).single()
  if (!church) notFound()

  const c = church as Church
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  const { data: eventsData } = await adminClient
    .from('events')
    .select('*, churches(*)')
    .eq('church_id', c.id)
    .eq('status', 'approved')
    .order('start_date', { ascending: false })
    .limit(100)

  const allEvents = (eventsData ?? []) as Event[]
  const upcoming = allEvents.filter(e => e.start_date >= now).reverse()
  const past     = allEvents.filter(e => e.start_date < now)

  const initial = c.name[0]?.toUpperCase() ?? '?'
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: c.name,
    description: c.description ?? undefined,
    url: `${siteUrl}/churches/${c.slug}`,
    logo: c.logo_url ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address ?? undefined,
      addressLocality: c.city ?? undefined,
      addressRegion: c.state ?? undefined,
      addressCountry: 'NG',
    },
    sameAs: [c.website_url, c.instagram, c.facebook].filter(Boolean),
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── PROFILE HEADER ──────────────────────────────────────────
          Clean. No gradient banner. Banner image shows clearly when
          available. Name and key info instantly readable.
      ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">

        {/* Banner image — only when it exists, no fake gradient replacement */}
        {c.banner_url && (
          <div className="relative w-full h-40 sm:h-52 bg-gray-100 overflow-hidden">
            <Image
              src={c.banner_url}
              alt={`${c.name} banner`}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className={c.banner_url ? '-mt-4 pt-0' : 'pt-5'}>
            <Link
              href="/churches"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Churches
            </Link>
          </div>

          {/* Identity row */}
          <div className="flex items-start gap-4 mt-4 pb-6">
            {/* Logo */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200 ${c.banner_url ? '-mt-10 ring-4 ring-white' : ''}`}>
              {c.logo_url ? (
                <Image src={c.logo_url} alt={c.name} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{initial}</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {c.verified_badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {c.is_featured && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Featured
                  </span>
                )}
                {c.is_claimed && !c.verified_badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{c.name}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                {(c.city || c.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {[c.city, c.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {c.denomination && (
                  <span className="text-gray-400">{c.denomination}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: about + events */}
          <div className="lg:col-span-2 space-y-8">

            {c.description && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {c.description}
                </p>
              </div>
            )}

            {/* Upcoming events */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Upcoming Events
                {upcoming.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">{upcoming.length}</span>
                )}
              </h2>
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-10 text-center bg-gray-50">
                  <Calendar className="w-7 h-7 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No upcoming events</p>
                  <p className="text-gray-400 text-xs mt-1">Check back soon</p>
                </div>
              )}
            </section>

            {/* Past events */}
            {past.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Past Events
                  <span className="ml-2 text-sm font-normal text-gray-400">{past.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="lg:sticky lg:top-6 self-start space-y-5">

            {/* Claim/verification state */}
            {c.verified_badge ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Gospello Verified</p>
                  <p className="text-xs text-indigo-600">Officially verified profile</p>
                </div>
              </div>
            ) : c.is_claimed ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Claimed Profile</p>
                  <p className="text-xs text-emerald-600">Managed by the church</p>
                </div>
              </div>
            ) : c.claim_requested_at ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Claim Pending</p>
                  <p className="text-xs text-amber-600">Claim request under review</p>
                </div>
              </div>
            ) : !c.profile_id ? (
              <div className="px-4 py-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">Is this your church?</p>
                <p className="text-xs text-gray-500 mb-3">Claim this profile to manage events, update your info, and get verified.</p>
                <Link
                  href={`/claim/church/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Claim this Profile
                </Link>
              </div>
            ) : null}

            {/* Church info */}
            {(c.address || c.service_times || c.phone || c.website_url || c.instagram || c.facebook) && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                <h2 className="text-sm font-bold text-gray-900">Church Info</h2>

                {c.address && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Address</p>
                    <p className="text-sm text-gray-700">{c.address}</p>
                    <p className="text-xs text-gray-500">{[c.city, c.state].filter(Boolean).join(', ')}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${c.address} ${c.city} ${c.state}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {c.service_times && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Service Times</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.service_times}</p>
                  </div>
                )}

                {c.phone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <a href={`tel:${c.phone}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {c.phone}
                    </a>
                  </div>
                )}

                {c.website_url && (
                  <div>
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {(c.instagram || c.facebook) && (
                  <div className="flex gap-2 pt-1">
                    {c.instagram && (
                      <a
                        href={c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors"
                      >
                        Instagram <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {c.facebook && (
                      <a
                        href={c.facebook.startsWith('http') ? c.facebook : `https://facebook.com/${c.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Facebook <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
