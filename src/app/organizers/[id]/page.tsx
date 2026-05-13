import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle, AlertTriangle, Globe, Phone, MessageCircle, User } from 'lucide-react'
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

  const displayName     = isSeeded ? seeded!.name          : organizer!.display_name
  const avatarUrl       = isSeeded ? seeded!.logo_url       : organizer!.avatar_url
  const bioText         = isSeeded ? seeded!.description    : organizer!.bio
  const websiteUrl      = isSeeded ? seeded!.website        : organizer!.website
  const phoneNum        = isSeeded ? seeded!.phone          : (organizer as unknown as Record<string, string | null>)?.phone ?? null
  const whatsappNum     = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.whatsapp ?? null
  const instagramUrl    = isSeeded ? seeded!.instagram      : (organizer as unknown as Record<string, string | null>)?.instagram ?? null
  const facebookUrl     = isSeeded ? seeded!.facebook       : (organizer as unknown as Record<string, string | null>)?.facebook ?? null
  const twitterUrl      = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.twitter ?? null
  const youtubeUrl      = isSeeded ? null                   : (organizer as unknown as Record<string, string | null>)?.youtube ?? null
  const contactPerson   = isSeeded ? seeded!.contact_person : (organizer as unknown as Record<string, string | null>)?.contact_person ?? null
  const ministryTypes: string[] = isSeeded
    ? (seeded!.ministry_type ? [seeded!.ministry_type] : [])
    : (() => {
        const raw = (organizer as unknown as Record<string, unknown>)?.ministry_types
        return Array.isArray(raw) ? raw as string[] : raw ? [String(raw)] : []
      })()
  const locationStr = isSeeded
    ? [seeded!.city, seeded!.state].filter(Boolean).join(', ')
    : [(organizer as unknown as Record<string, string | null>)?.city, organizer!.state].filter(Boolean).join(', ')

  const isVerified      = isSeeded ? seeded!.verified_badge       : false
  const isClaimed       = isSeeded ? seeded!.is_claimed           : true
  const hasPendingClaim = isSeeded ? !!seeded!.claim_requested_at  : false

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

  const initial   = displayName?.[0]?.toUpperCase() ?? '?'
  const siteUrl   = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
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

  const hasSocials = websiteUrl || phoneNum || whatsappNum || instagramUrl || facebookUrl || twitterUrl || youtubeUrl

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── COVER + AVATAR HEADER ───────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 h-32 relative">
        <Link
          href="/organizers"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Organizers
        </Link>
      </div>

      {/* Avatar row — overlaps cover */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4 -mt-12 pb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white ring-4 ring-white shadow-lg flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{initial}</span>
                </div>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {!isVerified && isClaimed && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Spacer to push content to right on desktop */}
          <div className="hidden sm:block flex-1" />

          {/* Social icon links — desktop only, in cover overlap zone */}
          {hasSocials && (
            <div className="hidden sm:flex items-center gap-2 mb-2">
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all"
                  title="Website">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-pink-600 hover:border-pink-300 shadow-sm transition-all"
                  title="Instagram">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://youtube.com/${youtubeUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm transition-all"
                  title="YouTube">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {whatsappNum && (
                <a href={`https://wa.me/${whatsappNum.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-all"
                  title="WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="pb-5 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{displayName}</h1>
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            {ministryTypes.length > 0 && <span className="font-medium text-gray-600">{ministryTypes.join(' · ')}</span>}
            {locationStr && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {locationStr}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3">
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{upcoming.length}</p>
              <p className="text-[11px] text-gray-500 font-medium">Upcoming</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-lg font-black text-gray-900">{past.length}</p>
              <p className="text-[11px] text-gray-500 font-medium">Past events</p>
            </div>
            {allEvents.length > 0 && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{allEvents.length}</p>
                  <p className="text-[11px] text-gray-500 font-medium">Total</p>
                </div>
              </>
            )}
          </div>

          {/* Mobile social icons */}
          {hasSocials && (
            <div className="flex sm:hidden items-center gap-2 mt-3">
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition-all">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-pink-600 shadow-sm transition-all">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {youtubeUrl && (
                <a href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://youtube.com/${youtubeUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 shadow-sm transition-all">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {whatsappNum && (
                <a href={`https://wa.me/${whatsappNum.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-emerald-600 shadow-sm transition-all">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {phoneNum && (
                <a href={`tel:${phoneNum}`}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition-all">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: about + events */}
          <div className="lg:col-span-2 space-y-8">

            {bioText && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2.5">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{bioText}</p>
              </div>
            )}

            {/* Upcoming events */}
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Upcoming Events
                {upcoming.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">{upcoming.length}</span>
                )}
              </h2>
              {upcoming.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-semibold text-sm">No upcoming events</p>
                  <p className="text-gray-400 text-xs mt-1">Follow this organizer to stay updated</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* Past events */}
            {past.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Past Events
                  <span className="ml-2 text-sm font-normal text-gray-400">{past.length}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {past.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-200"
                    >
                      {event.banner_url ? (
                        <Image
                          src={event.banner_url}
                          alt={event.title}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-black bg-gray-100">
                          {event.title[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white text-[11px] font-bold line-clamp-2 leading-snug">{event.title}</p>
                        <p className="text-white/70 text-[10px] mt-0.5">
                          {formatDate(event.start_date, { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="lg:sticky lg:top-6 self-start space-y-4">

            {/* Claim/verification card */}
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
                <div className="bg-white px-4 py-4 rounded-xl border border-gray-200">
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

            {/* Contact info card */}
            {(websiteUrl || phoneNum || whatsappNum || locationStr || contactPerson || facebookUrl || twitterUrl) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Contact Info</h2>

                {contactPerson && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {contactPerson}
                  </p>
                )}
                {locationStr && (
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {locationStr}
                  </p>
                )}
                {phoneNum && (
                  <a href={`tel:${phoneNum}`} className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {phoneNum}
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    Visit Website
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}

                {(facebookUrl || twitterUrl) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {facebookUrl && (
                      <a
                        href={facebookUrl.startsWith('http') ? facebookUrl : `https://facebook.com/${facebookUrl}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Facebook <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {twitterUrl && (
                      <a
                        href={twitterUrl.startsWith('http') ? twitterUrl : `https://x.com/${twitterUrl}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition-colors"
                      >
                        X / Twitter
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Not seeded organizer — joined date */}
            {!isSeeded && organizer && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Member since</p>
                <p className="text-sm font-bold text-gray-700 mt-0.5">
                  {formatDate(organizer.created_at, { month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
