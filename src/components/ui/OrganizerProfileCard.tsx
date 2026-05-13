import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, CheckCircle, Calendar } from 'lucide-react'

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
  eventCount,
  isVerified,
  isClaimed,
  ministryType,
  city,
  state,
}: Props) {
  const gradient = gradientFor(name)
  const initial = name[0]?.toUpperCase() ?? '?'
  const location = [city, state].filter(Boolean).join(', ')

  return (
    <Link href={`/organizers/${slug}`} className="group block h-full">
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl h-full flex flex-col">

        {/* Cover */}
        <div className="h-[72px] relative overflow-hidden flex-shrink-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          {avatarUrl && (
            <div className="absolute inset-0">
              <Image src={avatarUrl} alt="" fill className="object-cover scale-150 blur-xl opacity-40" sizes="300px" />
            </div>
          )}
        </div>

        {/* Avatar — overlaps cover */}
        <div className="flex justify-center relative z-10" style={{ marginTop: '-28px' }}>
          <div className="w-14 h-14 rounded-full border-[3px] border-white overflow-hidden shadow-md bg-white flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <span className="text-white font-black text-xl">{initial}</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="px-3 pt-2 pb-4 text-center flex flex-col flex-1">

          {/* Name + badge */}
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
              {name}
            </h3>
            {isVerified && (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-px" />
            )}
            {!isVerified && isClaimed && (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-px" />
            )}
          </div>

          {/* Ministry type */}
          {ministryType && (
            <p className="text-[11px] font-semibold text-violet-600 mb-1 truncate">{ministryType}</p>
          )}

          {/* Location */}
          {location && (
            <p className="text-[11px] text-gray-400 truncate">{location}</p>
          )}

          {/* Stats */}
          <div className="mt-auto pt-3 border-t border-gray-100 mt-3 flex items-center justify-center gap-1.5">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span className="text-sm font-bold text-gray-900 leading-none">{eventCount}</span>
            <span className="text-[10px] text-gray-400">events</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
