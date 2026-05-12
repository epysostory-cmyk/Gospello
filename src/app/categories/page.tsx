import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categories' }

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const admin = createAdminClient()
  const [{ data: categories }, { data: eventRows }] = await Promise.all([
    admin
      .from('categories')
      .select('id, name, slug, description, icon, color')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('events')
      .select('category')
      .eq('status', 'approved'),
  ])

  const countMap: Record<string, number> = {}
  for (const ev of eventRows ?? []) {
    if (ev.category) countMap[ev.category] = (countMap[ev.category] ?? 0) + 1
  }

  const cats = categories ?? []
  const totalEvents = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-1">Browse</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
            Categories
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {totalEvents > 0
              ? `${totalEvents.toLocaleString()} gospel events across ${cats.filter(c => (countMap[c.slug] ?? 0) > 0).length} categories`
              : 'Find gospel events by type'}
          </p>
        </div>
      </section>

      {/* List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {cats.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No categories yet — check back soon.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cats.map((cat) => {
              const count = countMap[cat.slug] ?? 0
              const hasEvents = count > 0
              const hex = cat.color ?? '#6B7280'

              if (!hasEvents) {
                return (
                  <div key={cat.slug} className="flex items-center gap-4 py-4 opacity-50 cursor-default">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: hex + '18' }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-700 text-sm">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">No events yet</span>
                  </div>
                )
              }

              return (
                <Link
                  key={cat.slug}
                  href={`/events?category=${cat.slug}`}
                  className="flex items-center gap-4 py-4 group hover:bg-gray-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors rounded-lg"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: hex + '18' }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-500">
                      {count} event{count === 1 ? '' : 's'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
