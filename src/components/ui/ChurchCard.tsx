import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, CheckCircle } from 'lucide-react'
import type { Church } from '@/types/database'

interface ChurchCardProps {
  church: Church
}

export default function ChurchCard({ church }: ChurchCardProps) {
  return (
    <Link
      href={`/churches/${church.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-indigo-100 to-purple-100">
        {church.banner_url && (
          <Image src={church.banner_url} alt={church.name} fill className="object-cover" />
        )}
        {/* Logo */}
        <div className="absolute -bottom-5 left-4">
          <div className="w-10 h-10 rounded-full border-2 border-white bg-white shadow overflow-hidden flex items-center justify-center">
            {church.logo_url ? (
              <Image src={church.logo_url} alt={church.name} width={40} height={40} className="object-cover" />
            ) : (
              <span className="text-indigo-600 font-bold text-sm">{church.name[0]}</span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-7 px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
            {church.name}
          </h3>
          {church.is_verified && (
            <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          )}
        </div>
        <div className="mt-2 space-y-1">
          {church.address && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{church.address}, {church.city}</span>
            </div>
          )}
          {church.service_times && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{church.service_times}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
