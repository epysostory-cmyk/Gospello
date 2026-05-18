export const revalidate = 60

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MapPin, Globe, Phone, ArrowLeft, Calendar, Pencil,
  ExternalLink, ShieldCheck, CheckCircle, AlertTriangle,
} from 'lucide-react'
import EventCard from '@/components/ui/EventCard'
import type { Church, Event } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const supabase = createAdminClient()
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

const DAY_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const DAY_LABEL: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

function fmt12(time: string) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function ServiceTimesDisplay({ raw }: { raw: string }) {
  let entries: { day: string; name: string; time: string }[] | null = null
  try { entries = JSON.parse(raw) } catch { /* legacy text */ }

  if (entries && Array.isArray(entries) && entries.length > 0) {
    const byDay = new Map<string, typeof entries>()
    for (const e of entries) {
      const d = e.day.toLowerCase()
      if (!byDay.has(d)) byDay.set(d, [])
      byDay.get(d)!.push(e)
    }
    const days = DAY_ORDER.filter(d => byDay.has(d))

    return (
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Schedule</p>
        <div className="space-y-3">
          {days.map(day => (
            <div key={day}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{DAY_LABEL[day]}</p>
              {byDay.get(day)!.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-gray-700">{e.name || 'Service'}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-4">{fmt12(e.time)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Legacy free-text fallback
  return (
    <div className="px-4 py-4 border-b border-gray-100">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Times</p>
      <div className="space-y-2">
        {raw.split('\n').filter(Boolean).map((line, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-gray-800">{line}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const GRADIENTS = [
  'from-violet-600 to-indigo-700',
  'from-blue-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-pink-600 to-rose-700',
  'from-indigo-600 to-purple-700',
]
function gradientFor(name: string) {
  return GRADIENTS[(name.charCodeAt(0) ?? 0) % GRADIENTS.length]
}

export default async function ChurchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { data: church } = await supabase.from('churches').select('*').eq('slug', slug).eq('is_hidden', false).single()
  if (!church) notFound()

  const c = church as Church
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Check if current user is an admin
  const isAdmin = user ? !!(await adminClient.from('admin_users').select('id').eq('id', user.id).maybeSingle()).data : false

  const { data: eventsData } = await adminClient
    .from('events')
    .select('*, churches(*)')
    .eq('church_id', c.id)
    .eq('status', 'approved')
    .order('start_date', { ascending: false })
    .limit(100)

  const allEvents = (eventsData ?? []) as Event[]
  const upcoming = allEvents.filter(e => e.start_date >= now).reverse()
  const past = allEvents.filter(e => e.start_date < now)

  const gradient = gradientFor(c.name)
  const initial = c.name[0]?.toUpperCase() ?? '?'
  const location = [c.city, c.state].filter(Boolean).join(', ')
  const pastorLine = [c.leader_title, c.pastor_name].filter(Boolean).join(' ')
  const isOwner = !!user && !!(c as any).owner_user_id && user.id === (c as any).owner_user_id
  const addEventUrl = isOwner
    ? `/dashboard/events/new?from_church=${c.id}&church_name=${encodeURIComponent(c.name)}&city=${encodeURIComponent(c.city ?? '')}&state=${encodeURIComponent(c.state ?? '')}&address=${encodeURIComponent(c.address ?? '')}&location_name=${encodeURIComponent(c.name)}`
    : null
  const editUrl = isAdmin
    ? `/admin/seededchurches/church/${c.id}/edit`
    : isOwner ? '/dashboard/profile' : null
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

  // The info card — rendered on mobile above events, and on desktop in sidebar
  const infoCard = (
    <div className="space-y-5">

      {/* Claim / verification status */}
      {c.verified_badge ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100">
          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">Gospello Verified</p>
            <p className="text-xs text-indigo-500 mt-0.5">Officially verified profile</p>
          </div>
        </div>
      ) : c.is_claimed ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Claimed Profile</p>
            <p className="text-xs text-emerald-500 mt-0.5">Managed by the church</p>
          </div>
        </div>
      ) : c.claim_requested_at ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Claim Pending</p>
            <p className="text-xs text-amber-500 mt-0.5">Under review</p>
          </div>
        </div>
      ) : !c.profile_id ? (
        <div className="px-4 py-4 rounded-2xl bg-gray-50 border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">Is this your church?</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Claim this profile to manage events, update your info, and get verified.
          </p>
          <Link
            href={`/claim/church/${c.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Claim this Profile
          </Link>
        </div>
      ) : null}

      {/* Church details */}
      {(c.service_times || c.address || c.phone || c.website_url || c.instagram || c.facebook || pastorLine) && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">

          {c.service_times && (
            <ServiceTimesDisplay raw={c.service_times} />
          )}

          {c.address && (
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Address</p>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 leading-snug">{c.address}</p>
                  {location && <p className="text-sm text-gray-500 mt-0.5">{location}</p>}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${c.address} ${c.city} ${c.state}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline mt-2"
                  >
                    Open in Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {(c.leader_title || c.pastor_name) && (
            <div className="px-4 py-4 border-b border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Leadership</p>
              {c.leader_title && (
                <p className="text-xs text-gray-500 mb-0.5">{c.leader_title}</p>
              )}
              {c.pastor_name && (
                <p className="text-sm font-semibold text-gray-900">{c.pastor_name}</p>
              )}
            </div>
          )}

          {c.phone && (
            <div className="px-4 py-3.5 border-b border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Phone</p>
              <a href={`tel:${c.phone}`} className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {c.phone}
              </a>
            </div>
          )}

          {(c.website_url || c.instagram || c.facebook) && (
            <div className="px-4 py-3.5 flex flex-wrap gap-2">
              {c.website_url && (
                <a
                  href={c.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" /> Website
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              )}
              {c.instagram && (
                <a
                  href={c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors"
                >
                  Instagram
                </a>
              )}
              {c.facebook && (
                <a
                  href={c.facebook.startsWith('http') ? c.facebook : `https://facebook.com/${c.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── PROFILE HEADER ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">

        {/* Cover */}
        <div className="relative h-36 sm:h-48 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          {c.logo_url && !c.banner_url && (
            <div className="absolute inset-0">
              <Image
                src={c.logo_url}
                alt=""
                fill
                className="object-cover scale-150 blur-2xl opacity-30"
                priority
              />
            </div>
          )}
          {c.banner_url && (
            <Image
              src={c.banner_url}
              alt=""
              fill
              className="object-cover"
              priority
            />
          )}

          {/* Back link floated on cover */}
          <div className="absolute top-4 left-4 sm:left-6 lg:left-8">
            <Link
              href="/churches"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Churches
            </Link>
          </div>
        </div>

        {/* Avatar + identity */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 flex items-end gap-4" style={{ marginTop: '-36px' }}>

            {/* Circular avatar overlapping cover */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden shadow-md bg-white flex-shrink-0">
              {c.logo_url ? (
                <Image
                  src={c.logo_url}
                  alt={c.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-white font-black text-3xl">{initial}</span>
                </div>
              )}
            </div>

            {/* Badges row — sits at bottom of avatar line */}
            <div className="flex items-center gap-2 pb-3 flex-wrap">
              {c.verified_badge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {c.is_featured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Featured
                </span>
              )}
              {c.is_claimed && !c.verified_badge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="mt-3 pb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {c.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
              {c.denomination && (
                <span className="font-medium text-violet-600">{c.denomination}</span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {upcoming.length} upcoming event{upcoming.length !== 1 ? 's' : ''}
              </span>
            </div>

            {(addEventUrl || editUrl) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {addEventUrl && (
                  <Link
                    href={addEventUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Post an Event
                  </Link>
                )}
                {editUrl && (
                  <Link
                    href={editUrl}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold transition-colors shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            {c.description && (
              <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap">
                  {c.description}
                </p>
              </div>
            )}

            {/* Church info — mobile only, sits before events */}
            <div className="lg:hidden">
              {infoCard}
            </div>

            {/* Upcoming events */}
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                Upcoming Events
                {upcoming.length > 0 && (
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                )}
              </h2>
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                  <Calendar className="w-6 h-6 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No upcoming events</p>
                  <p className="text-xs text-gray-400 mt-1">Check back soon</p>
                </div>
              )}
            </section>

            {/* Past events */}
            {past.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Past Events
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {past.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── SIDEBAR — desktop only ───────────────────────────────── */}
          <div className="hidden lg:block lg:sticky lg:top-6 self-start">
            {infoCard}
          </div>

        </div>
      </div>
    </div>
  )
}
