export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Event, Church } from '@/types/database'
import FeaturedToggle from './FeaturedToggle'

export default async function AdminFeaturedPage() {
  const supabase = await createClient()

  const [eventsRes, churchesRes] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString())
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: true })
      .limit(30),

    supabase
      .from('churches')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true })
      .limit(30),
  ])

  const events = (eventsRes.data ?? []) as Event[]
  const churches = (churchesRes.data ?? []) as Church[]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Featured Content</h1>
        <p className="text-gray-500 mt-1">Choose which events and churches appear on the homepage</p>
      </div>

      {/* Featured Events */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Events</h2>
          <p className="text-sm text-gray-500">Toggle events to feature them on the homepage hero section</p>
        </div>
        <div className="divide-y divide-gray-50">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(event.start_date, { month: 'short', day: 'numeric' })} · {event.city}
                </p>
              </div>
              <FeaturedToggle
                id={event.id}
                table="events"
                isFeatured={event.is_featured}
              />
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-gray-500 text-sm px-5 py-8 text-center">No approved events</p>
          )}
        </div>
      </div>

      {/* Featured Churches */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Churches</h2>
          <p className="text-sm text-gray-500">Toggle churches to feature them on the homepage</p>
        </div>
        <div className="divide-y divide-gray-50">
          {churches.map((church) => (
            <div key={church.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-gray-900">{church.name}</p>
                <p className="text-xs text-gray-500">{church.city}</p>
              </div>
              <FeaturedToggle
                id={church.id}
                table="churches"
                isFeatured={church.is_featured}
              />
            </div>
          ))}
          {churches.length === 0 && (
            <p className="text-gray-500 text-sm px-5 py-8 text-center">No churches yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
