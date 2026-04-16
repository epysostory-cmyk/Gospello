import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  {
    label: 'Worship',
    value: 'worship',
    emoji: '🙏',
    description: 'Praise and worship gatherings, worship concerts and nights of adoration',
    gradient: 'from-indigo-500 to-purple-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
  },
  {
    label: 'Prayer',
    value: 'prayer',
    emoji: '✨',
    description: 'Corporate prayer meetings, intercession nights and prayer conferences',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
  },
  {
    label: 'Conference',
    value: 'conference',
    emoji: '🎤',
    description: 'Christian conferences, seminars, summits and kingdom gatherings',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100',
  },
  {
    label: 'Youth',
    value: 'youth',
    emoji: '🌟',
    description: 'Youth programs, teen camps, young adult fellowships and retreats',
    gradient: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-100',
  },
  {
    label: 'Training',
    value: 'training',
    emoji: '📖',
    description: 'Bible studies, discipleship training, leadership and ministry workshops',
    gradient: 'from-green-500 to-teal-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-100',
  },
  {
    label: 'Other',
    value: 'other',
    emoji: '⛪',
    description: 'Outreach events, community service, crusades and special gatherings',
    gradient: 'from-gray-500 to-slate-600',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-100',
  },
]

async function getCategoryCounts() {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const in60Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const counts: Record<string, number> = {}

  await Promise.all(
    CATEGORIES.map(async (cat) => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('category', cat.value)
        .gte('start_date', now)
        .lte('start_date', in60Days)
      counts[cat.value] = count ?? 0
    })
  )

  return counts
}

export default async function CategoriesPage() {
  const counts = await getCategoryCounts()

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.value] ?? 0
            return (
              <Link
                key={cat.value}
                href={`/events?category=${cat.value}`}
                className={`group relative bg-white rounded-3xl border ${cat.border} overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Top gradient bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${cat.gradient}`} />

                <div className="p-7">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-md mb-5`}>
                    {cat.emoji}
                  </div>

                  {/* Label + count */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {cat.label}
                    </h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>
                      {count > 0 ? `${count} upcoming` : 'Coming soon'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    {cat.description}
                  </p>

                  {/* CTA */}
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${cat.text} group-hover:gap-2.5 transition-all`}>
                    Browse {cat.label} Events
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
