import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, cn } from '@/lib/utils'
import { Calendar, MapPin, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle, AlertTriangle, Globe, Phone, MessageCircle, User } from 'lucide-react'
import type { Profile, SeededOrganizer, Event } from '@/types/database'
import BackButton from '@/components/ui/BackButton'
import EventCard from '@/components/ui/EventCard'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  // Try auth profile first, then seeded
  const { data: p } = await supabase.from('profiles').select('display_name').eq('id', id).single()
  if (p) return { title: p.display_name }
  const adminClient = createAdminClient()
  const { data: s } = await adminClient.from('seeded_organizers').select('name').or(`id.eq.${id},slug.eq.${id}`).limit(1).single()
  if (s) return { title: s.name }
  return {}
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
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Try auth organizer first
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('account_type', 'organizer')
    .single()

  // Then try seeded organizer — match by either id or slug (links may use either)
  const { data: seededData } = profileData
    ? { data: null }
    : await adminClient
        .from('seeded_organizers')
        .select('*')
        .eq('is_hidden', false)
        .or(`id.eq.${id},slug.eq.${id}`)
        .limit(1)
        .single()

  if (!profileData && !seededData) notFound()

  const isSeeded = !profileData
  const organizer = profileData as Profile | null
  const seeded = seededData as SeededOrganizer | null

  const displayName = isSeeded ? seeded!.name : organizer!.display_name
  const avatarUrl = isSeeded ? seeded!.logo_url : organizer!.avatar_url
  const bioText = isSeeded ? seeded!.description : organizer!.bio
  const websiteUrl = isSeeded ? seeded!.website : organizer!.website
  const phoneNum = isSeeded ? seeded!.phone : (organizer as unknown as Record<string, string | null>)?.phone ?? null
  const whatsappNum = isSeeded ? null : (organizer as unknown as Record<string, string | null>)?.whatsapp ?? null
  const instagramUrl = isSeeded ? seeded!.instagram : (organizer as unknown as Record<string, string | null>)?.instagram ?? null
  const facebookUrl = isSeeded ? seeded!.facebook : (organizer as unknown as Record<string, string | null>)?.facebook ?? null
  const twitterUrl = isSeeded ? null : (organizer as unknown as Record<string, string | null>)?.twitter ?? null
  const youtubeUrl = isSeeded ? null : (organizer as unknown as Record<string, string | null>)?.youtube ?? null
  const contactPerson = isSeeded ? seeded!.contact_person : (organizer as unknown as Record<string, string | null>)?.contact_person ?? null
  const ministryTypes: string[] = isSeeded
    ? (seeded!.ministry_type ? [seeded!.ministry_type] : [])
    : (() => { const raw = (organizer as unknown as Record<string, unknown>)?.ministry_types; return Array.isArray(raw) ? raw as string[] : raw ? [String(raw)] : [] })()
  const cityStr = isSeeded ? seeded!.city : (organizer as unknown as Record<string, string | null>)?.city ?? null
  const locationStr = isSeeded
    ? [seeded!.city, seeded!.state].filter(Boolean).join(', ')
    : [cityStr, organizer!.state].filter(Boolean).join(', ')

  // Claim state (seeded organizers only)
  const isVerified = isSeeded ? seeded!.verified_badge : false
  const isClaimed = isSeeded ? seeded!.is_claimed : true // auth organizers own their profile
  const hasPendingClaim = isSeeded ? !!seeded!.claim_requested_at : false

  // Use the actual DB id (not the URL param which may be a slug) for event lookup
  const eventsProfileId = isSeeded ? seeded!.id : id

  // Use adminClient to bypass RLS — profile pages are public and need to show all approved events
  const eventsQuery = adminClient
    .from('events')
    .select('*, churches(*)')
    .eq(isSeeded ? 'seeded_organizer_id' : 'organizer_id', eventsProfileId)
    .eq('status', 'approved')
    .is('church_id', null)
    .order('start_date', { ascending: false })
    .limit(100)

  // For auth organizers (incl. admin accounts): exclude events that belong to a seeded org or church
  const { data: allEventsData } = isSeeded
    ? await eventsQuery
    : await eventsQuery.is('seeded_organizer_id', null)

  const allEvents = (allEventsData ?? []) as Event[]
  const upcoming = allEvents.filter(e => e.start_date >= now).reverse()
  const past     = allEvents.filter(e => e.start_date < now)

  const gradientKey = (displayName?.charCodeAt(0) ?? 0) % 6
  const bannerGradient = BANNER_GRADIENTS[gradientKey]
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-6xl mx-auto px-4 pt-4">
        <BackButton />
      </div>

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className={`relative w-full bg-gradient-to-br ${bannerGradient} overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          <Link
            href="/organizers"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Organizers
          </Link>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
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

            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white/90 backdrop-blur-sm">
                  Event Organizer
                </span>
                {isVerified && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/80 text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Gospello Verified
                  </span>
                )}
                {!isVerified && isClaimed && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/70 text-white flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Claimed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">{displayName}</h1>
              {ministryTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ministryTypes.map(t => (
                    <span key={t} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">{t}</span>
                  ))}
                </div>
              )}
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
                {locationStr && (
                  <span className="flex items-center gap-1 text-white/50">
                    <MapPin className="w-3 h-3" />{locationStr}
                  </span>
                )}
                {!isSeeded && organizer && (
                  <span className="text-white/40">
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

          {/* Left: bio + events */}
          <div className="lg:col-span-2 space-y-8">

            {bioText && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">About {displayName}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">{bioText}</p>
              </div>
            )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Right: sidebar */}
          <div className="lg:sticky lg:top-6 self-start space-y-4">

            {/* Claim state — only for seeded organizers */}
            {isSeeded && (
              isVerified ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Gospello Verified</p>
                    <p className="text-xs text-indigo-600">This profile is officially verified</p>
                  </div>
                </div>
              ) : isClaimed ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Claimed Profile</p>
                    <p className="text-xs text-emerald-600">Managed by the organizer</p>
                  </div>
                </div>
              ) : hasPendingClaim ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Claim Pending</p>
                    <p className="text-xs text-amber-600">A claim request is under review</p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-sm font-bold text-gray-900 mb-1">Are you an organizer?</p>
                  <p className="text-xs text-gray-500 mb-3">Claim this profile to manage events and get verified.</p>
                  <Link
                    href={`/claim/organizer/${seeded!.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold hover:bg-[#6D28D9] transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Claim this Profile
                  </Link>
                </div>
              )
            )}

            {/* Info card */}
            {(websiteUrl || phoneNum || whatsappNum || locationStr || contactPerson || instagramUrl || facebookUrl || twitterUrl || youtubeUrl) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                <h2 className="font-bold text-gray-900">Info</h2>
                {contactPerson && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">Contact</p>
                      <p className="text-sm text-gray-700">{contactPerson}</p>
                    </div>
                  </div>
                )}
                {locationStr && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-sm text-gray-700">{locationStr}</p>
                  </div>
                )}
                {phoneNum && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </div>
                    <a href={`tel:${phoneNum}`} className="text-sm font-medium text-indigo-600 hover:underline">{phoneNum}</a>
                  </div>
                )}
                {whatsappNum && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <a href={`https://wa.me/${whatsappNum.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline">WhatsApp</a>
                  </div>
                )}
                {websiteUrl && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-sky-500" />
                    </div>
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline inline-flex items-center gap-1">
                      Visit Website <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {(instagramUrl || facebookUrl || twitterUrl || youtubeUrl) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {instagramUrl && (
                      <a href={instagramUrl.startsWith('http') ? instagramUrl : `https://instagram.com/${instagramUrl}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors">
                        Instagram <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {facebookUrl && (
                      <a href={facebookUrl.startsWith('http') ? facebookUrl : `https://facebook.com/${facebookUrl}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        Facebook <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {twitterUrl && (
                      <a href={twitterUrl.startsWith('http') ? twitterUrl : `https://x.com/${twitterUrl}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition-colors">
                        X / Twitter <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {youtubeUrl && (
                      <a href={youtubeUrl.startsWith('http') ? youtubeUrl : `https://youtube.com/${youtubeUrl}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                        YouTube <ExternalLink className="w-3 h-3" />
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
