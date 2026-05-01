import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categories' }

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const admin = createAdminClient()
  // Fetch visible categories + all approved event categories in parallel
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

  // Count events per category slug
  const countMap: Record<string, number> = {}
  for (const ev of eventRows ?? []) {
    if (ev.category) countMap[ev.category] = (countMap[ev.category] ?? 0) + 1
  }

  const cats = categories ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900">All Categories</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Explore gospel events by type — find what speaks to your spirit
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cats.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No categories yet.</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats.map((cat) => {
              const count = countMap[cat.slug] ?? 0
              const hex = cat.color ?? '#6B7280'
              const hasEvents = count > 0

              const cardContent = (
                <>
                  {/* Top color bar */}
                  <div className="h-2 w-full" style={{ backgroundColor: hex }} />

                  <div className="p-7">
                    {/* Icon circle */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md mb-5"
                      style={{ backgroundColor: hex, opacity: hasEvents ? 1 : 0.5 }}
                    >
                      {cat.icon}
                    </div>

                    {/* Name + count */}
                    <div className="flex items-center justify-between mb-3">
                      <h2 className={`text-xl font-bold transition-colors ${hasEvents ? 'text-gray-900 group-hover:text-indigo-600' : 'text-gray-400'}`}>
                        {cat.name}
                      </h2>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={hasEvents
                          ? { backgroundColor: hex + '18', color: hex }
                          : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
                        }
                      >
                        {hasEvents ? `${count} event${count === 1 ? '' : 's'}` : 'Coming soon'}
                      </span>
                    </div>

                    {/* Description */}
                    {cat.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-5">
                        {cat.description}
                      </p>
                    )}

                    {/* CTA */}
                    {hasEvents ? (
                      <div
                        className="flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                        style={{ color: hex }}
                      >
                        Browse {cat.name} Events
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No events yet — check back soon</p>
                    )}
                  </div>
                </>
              )

              return hasEvents ? (
                <Link
                  key={cat.slug}
                  href={`/events?category=${cat.slug}`}
                  className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={cat.slug}
                  className="relative bg-white rounded-3xl border border-gray-100 overflow-hidden opacity-70 cursor-default"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
