'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'

export interface OrganizerCard {
  id: string
  name: string
  slug: string
  logo_url: string | null
  ministry_type: string | null
  city: string
  state: string
  verified_badge: boolean
  source: 'profile' | 'seeded'
}

interface Props {
  organizers: OrganizerCard[]
}

export default function DiscoverOrganizers({ organizers }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (organizers.length === 0) return null

  return (
    <section ref={sectionRef} className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Meet the Organizers</h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Ministries and organizers bringing gospel events to life</p>
        </div>
        <Link href="/organizers" className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-1">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Scroll container */}
      <div
        className="flex gap-4 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {organizers.map((org, i) => (
          <div
            key={`${org.source}-${org.id}`}
            className="flex-shrink-0 snap-start"
            style={{
              width: '160px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.4s ease ${i * 50}ms, transform 0.4s ease ${i * 50}ms`,
            }}
          >
            <div
              className="flex flex-col items-center text-center p-4"
              style={{
                borderRadius: '20px',
                background: 'white',
                border: '1px solid #F3F4F6',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 flex-shrink-0 flex items-center justify-center"
                style={{ background: org.logo_url ? undefined : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
                {org.logo_url ? (
                  <Image src={org.logo_url} alt={org.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-2xl">🎤</span>
                )}
              </div>

              {/* Name + verified */}
              <div className="flex items-center gap-1 justify-center mb-1">
                <p className="text-[14px] font-bold text-[#111827] line-clamp-2 leading-tight">{org.name}</p>
                {org.verified_badge && (
                  <span className="text-amber-500 text-xs flex-shrink-0" title="Verified">✓</span>
                )}
              </div>

              {/* Ministry type */}
              {org.ministry_type && (
                <span className="inline-block bg-purple-100 text-purple-700 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1.5 truncate max-w-full">
                  {org.ministry_type}
                </span>
              )}

              {/* Location */}
              <p className="text-[12px] text-gray-400 mb-3">
                {[org.city, org.state].filter(Boolean).join(', ')}
              </p>

              {/* Button */}
              <Link
                href={`/organizers/${org.id}`}
                className="w-full h-8 flex items-center justify-center text-[12px] font-semibold text-gray-700 bg-white hover:bg-purple-700 hover:text-white transition-colors rounded-xl"
                style={{ border: '1.5px solid #E5E7EB' }}
              >
                View Organizer
              </Link>
            </div>
          </div>
        ))}

        {/* Trailing padding */}
        <div className="flex-shrink-0 w-4" />
      </div>

    </section>
  )
}
