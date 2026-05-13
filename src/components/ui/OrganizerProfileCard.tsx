import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CalendarDays, BadgeCheck } from 'lucide-react'

const COVERS = [
  'from-slate-700 to-slate-900',
  'from-zinc-700 to-zinc-900',
  'from-stone-600 to-stone-900',
  'from-neutral-700 to-neutral-900',
  'from-gray-600 to-gray-900',
  'from-sky-800 to-slate-900',
  'from-teal-800 to-slate-900',
  'from-emerald-800 to-slate-900',
]

function coverFor(name: string) {
  return COVERS[(name.charCodeAt(0) ?? 0) % COVERS.length]
}

interface Props {
  id: string
  slug: string
  name: string
  avatarUrl: string | null
  description: string | null
  eventCount: number
  isVerified: boolean
  isClaimed: boolean
  ministryType: string | null
  city: string
  state: string
}

export default function OrganizerProfileCard({
  slug,
  name,
  avatarUrl,
  description,
  eventCount,
  isVerified,
  ministryType,
  city,
  state,
}: Props) {
  const cover = coverFor(name)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const location = [city, state].filter(Boolean).join(', ')

  return (
    <Link href={`/organizers/${slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col h-full">

        {/* Cover */}
        <div className={`h-[64px] bg-gradient-to-br ${cover} relative flex-shrink-0 overflow-hidden`}>
          {avatarUrl && (
            <Image src={avatarUrl} alt="" fill className="object-cover opacity-20 blur-md scale-110" sizes="300px" />
          )}
        </div>

        {/* Avatar row — overlaps cover */}
        <div className="px-4 flex items-end justify-between" style={{ marginTop: '-22px' }}>
          <div className="w-11 h-11 rounded-full border-[2.5px] border-white overflow-hidden bg-gray-100 shadow-md flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} width={44} height={44} className="object-cover w-full h-full" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${cover} flex items-center justify-center`}>
                <span className="text-white font-black text-sm">{initials}</span>
              </div>
            )}
          </div>

          {eventCount > 0 && (
            <div className="mb-0.5 flex items-center gap-1 bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
              <CalendarDays className="w-3 h-3" />
              <span className="text-[11px] font-semibold">{eventCount}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-4 pt-2 pb-4 flex flex-col flex-1">
          {/* Name */}
          <div className="flex items-center gap-1 mb-0.5">
            <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1 group-hover:text-gray-600 transition-colors">
              {name}
            </h3>
            {isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            )}
          </div>

          {/* Ministry type */}
          {ministryType && (
            <span className="text-[11px] font-medium text-gray-500 mb-2 line-clamp-1">
              {ministryType}
            </span>
          )}

          {/* Bio */}
          <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {description || 'Gospel event organizer'}
          </p>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 mt-2.5 text-[11px] text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
