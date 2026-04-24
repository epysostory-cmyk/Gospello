export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Star } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import FeatureToggle from './FeatureToggle'

export default async function AdminFeaturedPage({
  searchParams,
}: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const adminClient = createAdminClient()
  const params   = await searchParams
  const search   = (params.search as string) || ''
  const tab      = (params.tab    as string) || 'featured'
  const page     = parseInt((params.page as string) || '1')
  const pageSize = 20

  let query = adminClient
    .from('events')
    .select('id, title, is_featured, featured_until, status, start_date, views_count, profiles(display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (tab === 'featured') query = query.eq('is_featured', true)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data: events, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const totalPages = Math.ceil((total ?? 0) / pageSize)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Featured Events</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Manage the featured events showcase</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{href:'/admin/featured',          label:'Featured', tab:'featured'},
          {href:'/admin/featured?tab=all',  label:'All Events', tab:'all'}
        ].map(({ href, label, tab: t }) => (
          <Link key={t} href={href}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${tab === t ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'featured' && <Star className="w-4 h-4" />}{label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/featured" className="flex gap-2">
        {tab !== 'featured' && <input type="hidden" name="tab" value={tab} />}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" name="search" placeholder="Search events..." defaultValue={search}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9]">Search</button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Event','Organizer','Status','Date','Views','Expires','Featured'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!events || events.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                  {tab === 'featured' ? 'No featured events — go to All Events to feature one' : 'No events found'}
                </td></tr>
              ) : events.map((event) => {
                const profile   = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                const organizer = (profile as {display_name:string})?.display_name || 'Unknown'
                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {event.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{organizer}</p></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        event.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        event.status === 'pending'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'}`}>{event.status}</span>
                    </td>
                    <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{event.start_date ? formatDate(event.start_date, { month: 'short', day: 'numeric' }) : '—'}</p></td>
                    <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{event.views_count || 0}</p></td>
                    <td className="px-5 py-3.5">
                      {event.is_featured ? (
                        event.featured_until ? (
                          <span className={`text-xs font-medium ${new Date(event.featured_until) < new Date() ? 'text-red-500' : 'text-green-600'}`}>
                            {new Date(event.featured_until) < new Date() ? '⚠ Expired' : formatDate(event.featured_until, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : <span className="text-xs text-violet-600 font-medium">Permanent</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5"><FeatureToggle eventId={event.id} isFeatured={event.is_featured ?? false} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/admin/featured?tab=${tab}&page=${page-1}${search?`&search=${search}`:''}`} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Previous</Link>}
              {page < totalPages && <Link href={`/admin/featured?tab=${tab}&page=${page+1}${search?`&search=${search}`:''}`} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
