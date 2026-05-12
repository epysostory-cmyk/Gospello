import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle, AlertTriangle, Globe, Phone, MessageCircle, User, Instagram, Facebook } from 'lucide-react'
import type { Profile, SeededOrganizer, Event } from '@/types/database'
import { getEventLifecycle } from '@/types/database'
import EventCard from '@/components/ui/EventCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let name: string | null = null
  let bio: string | null = null
  let logo: string | null = null
  let city: string | null = null

  const { data: p } = await supabase.from('profiles').select('display_name, bio, avatar_url, city').eq('id', id).maybeSingle()
  if (p) { name = p.display_name; bio = p.bio; logo = p.avatar_url; city = p.city }

  if (!name) {
    const { data: bySlug } = await adminClient.from('seeded_organizers').select('name, description, logo_url, city').eq('slug', id).maybeSingle()
    if (bySlug) { name = bySlug.name; bio = bySlug.description; logo = bySlug.logo_url; city = bySlug.city }
  }
  if (!name && isUuid) {
    const { data: byId } = await adminClient.from('seeded_organizers').select('name, description, logo_url, city').eq('id', id).maybeSingle()
    if (byId) { name = byId.name; bio = byId.description; logo = byId.logo_url; city = byId.city }
  }
  if (!name) return {}

  const description = bio
    ? bio.slice(0, 160)
    : `Discover events by ${name}${city ? ` in ${city}` : ''} on Gospello.`
  const pageUrl = `${siteUrl}/organizers/${id}`

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Gospello`,
      description,
      url: pageUrl,
      type: 'profile',
      siteName: 'Gospello',
      images: logo ? [{ url: logo, width: 400, height: 400, alt: name }] : [],
    },
    twitter: {
      card: logo ? 'summary' : 'summary',
      site: '@gospello',
      title: `${name} | Gospello`,
      description,
      images: logo ? [logo] : [],
    },
  }
}

export default async function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('account_type', 'organizer')
    .single()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  let seededData: SeededOrganizer | null = null
  if (!profileData) {
    const q = adminClient.from('seeded_organizers').select('*').eq('is_hidden', false)
    const { data: bySlug } = await q.eq('slug', id).maybeSingle()
    if (bySlug) {
      seededData = bySlug as SeededOrganizer
    } else if (isUuid) {
      const { data: byId } = await adminClient.from('seeded_organizers').select('*').eq('is_hidden', false).eq('id', id).maybeSingle()
      seededData = byId as SeededOrganizer | null
    }
  }

  if (!profileData && !seededData) notFound()

  const isSeeded = !profileData
  const organizer = profileData as Profile | null
  const seeded = seededData as SeededOrganizer | null

  const displayName    = isSeeded ? seeded!.name          : organizer!.display_name
  const avatarUrl      = isSeeded ? seeded!.logo_url       : organizer!.avatar_url
  const bioText        = isSeeded ? seeded!.description    : organizer!.bio
  const websiteUrl     = isSeeded ? seeded!.website        : organizer!.website
  const phoneNum       = isSeeded ? seeded!.phone          : (organizer as unknown as Record<string, string | null>)?.phone ?? null
  const whatsappNum    = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.whatsapp ?? null
  const instagramUrl   = isSeeded ? seeded!.instagram      : (organizer as unknown as Record<string, string | null>)?.instagram ?? null
  const facebookUrl    = isSeeded ? seeded!.facebook       : (organizer as unknown as Record<string, string | null>)?.facebook ?? null
  const twitterUrl     = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.twitter ?? null
  const youtubeUrl     = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.youtube ?? null
  const contactPerson  = isSeeded ? seeded!.contact_person : (organizer as unknown as Record<string, string | null>)?.contact_person ?? null
  const ministryTypes: string[] = isSeeded
    ? (seeded!.ministry_type ? [seeded!.ministry_type] : [])
    : (() => {
        const raw = (organizer as unknown as Record<string, unknown>)?.ministry_types
        return Array.isArray(raw) ? raw as string[] : raw ? [String(raw)] : []
      })()
  const locationStr = isSeeded
    ? [seeded!.city, seeded!.state].filter(Boolean).join(', ')
    : [(organizer as unknown as Record<string, string | null>)?.city, organizer!.state].filter(Boolean).join(', ')

  const isVerified     = isSeeded ? seeded!.verified_badge       : false
  const isClaimed      = isSeeded ? seeded!.is_claimed           : true
  const hasPendingClaim = isSeeded ? !!seeded!.claim_requested_at : false

  const eventsProfileId = isSeeded ? seeded!.id : id

  const eventsQuery = adminClient
    .from('events')
    .select('*, churches(*)')
    .eq(isSeeded ? 'seeded_organizer_id' : 'organizer_id', eventsProfileId)
    .eq('status', 'approved')
    .is('church_id', null)
    .order('start_date', { ascending: false })
    .limit(100)

  const { data: allEventsData } = isSeeded
    ? await eventsQuery
    : await eventsQuery.is('seeded_organizer_id', null)

  const allEvents = (allEventsData ?? []) as Event[]
  const upcoming  = allEvents.filter(e => getEventLifecycle(e.start_date, e.end_date) !== 'ended').reverse()
  const past      = allEvents.filter(e => getEventLifecycle(e.start_date, e.end_date) === 'ended')

  const initial  = displayName?.[0]?.toUpperCase() ?? '?'
  const siteUrl  = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const profileUrl = `${siteUrl}/organizers/${id}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: displayName,
    description: bioText ?? undefined,
    url: profileUrl,
    logo: avatarUrl ?? undefined,
    address: locationStr ? { '@type': 'PostalAddress', addressLocality: locationStr } : undefined,
    sameAs: [instagramUrl, facebookUrl, websiteUrl].filter(Boolean),
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── PROFILE HEADER ──────────────────────────────────────────
          White, clean. Avatar + name + meta visible immediately.
          No gradient. No theater.
      ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-6">

          {/* Back link */}
          <Link
            href="/organizers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Organizers
          </Link>

          {/* Identity row */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{initial}</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {!isVerified && isClaimed && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{displayName}</h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                {ministryTypes.length > 0 && (
                  <span>{ministryTypes.join(' · ')}</span>
                )}
                {locationStr && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {locationStr}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}
                </span>
                {!isSeeded && organizer && (
                  <span className="text-gray-400 text-xs">
                    Since {formatDate(organizer.created_at, { month: 'short', year: 'numeric' })}
                  </span>
                )}
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

            {bioText && (
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{bioText}</p>
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
              {upcoming.length === 0 ? (
                <div className="border border-gray-200 rounded-xl p-10 text-center bg-gray-50">
                  <Calendar className="w-7 h-7 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No upcoming events</p>
                  <p className="text-gray-400 text-xs mt-1">Check back soon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
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
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group flex gap-3 border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        {event.banner_url ? (
                          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-bold">
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

          {/* Right: sidebar */}
          <div className="lg:sticky lg:top-6 self-start space-y-5">

            {/* Claim/verification state */}
            {isSeeded && (
              isVerified ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Gospello Verified</p>
                    <p className="text-xs text-indigo-600">Officially verified profile</p>
                  </div>
                </div>
              ) : isClaimed ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Claimed Profile</p>
                    <p className="text-xs text-emerald-600">Managed by the organizer</p>
                  </div>
                </div>
              ) : hasPendingClaim ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Claim Pending</p>
                    <p className="text-xs text-amber-600">Claim request under review</p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Is this your ministry?</p>
                  <p className="text-xs text-gray-500 mb-3">Claim this profile to manage your events and get verified.</p>
                  <Link
                    href={`/claim/organizer/${seeded!.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Claim this Profile
                  </Link>
                </div>
              )
            )}

            {/* Contact / info */}
            {(websiteUrl || phoneNum || whatsappNum || locationStr || contactPerson || instagramUrl || facebookUrl || twitterUrl || youtubeUrl) && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                <h2 className="text-sm font-bold text-gray-900">Contact Info</h2>

                {contactPerson && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Contact person</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {contactPerson}
                    </p>
                  </div>
                )}

                {locationStr && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Location</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {locationStr}
                    </p>
                  </div>
                )}

                {phoneNum && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <a href={`tel:${phoneNum}`} className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {phoneNum}
                    </a>
                  </div>
                )}

                {whatsappNum && (
                  <div>
                    <a
                      href={`https://wa.me/${whatsappNum.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-600 hover:underline flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                )}

                {websiteUrl && (
                  <div>
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline inline-flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {(instagramUrl || facebookUrl || twitterUrl || youtubeUrl) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {instagramUrl && (
                      <a
                        href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors"
                      >
                        <Instagram className="w-3 h-3" /> Instagram
                      </a>
                    )}
                    {facebookUrl && (
                      <a
                        href={facebookUrl.startsWith('http') ? facebookUrl : `https://facebook.com/${facebookUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Facebook className="w-3 h-3" /> Facebook
                      </a>
                    )}
                    {twitterUrl && (
                      <a
                        href={twitterUrl.startsWith('http') ? twitterUrl : `https://x.com/${twitterUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition-colors"
                      >
                        X / Twitter
                      </a>
                    )}
                    {youtubeUrl && (
                      <a
                        href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://youtube.com/${youtubeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        YouTube
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
