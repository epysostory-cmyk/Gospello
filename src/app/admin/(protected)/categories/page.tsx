export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import AddCategoryForm from './AddCategoryForm'
import CategoryRowActions from './CategoryRowActions'

export default async function AdminCategoriesPage() {
  const adminClient = createAdminClient()

  const [{ data: categories }, { data: eventCounts }] = await Promise.all([
    adminClient
      .from('categories')
      .select('id, name, slug, description, icon, color, is_visible, sort_order')
      .order('sort_order', { ascending: true }),
    // Count events per category slug
    adminClient
      .from('events')
      .select('category')
      .eq('status', 'approved'),
  ])

  // Build count map
  const countMap: Record<string, number> = {}
  for (const ev of eventCounts ?? []) {
    if (ev.category) countMap[ev.category] = (countMap[ev.category] ?? 0) + 1
  }

  const cats = categories ?? []

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Categories</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {cats.length} categories · {cats.filter(c => c.is_visible).length} visible on website
          </p>
        </div>
        <AddCategoryForm />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Events</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No categories yet. Add your first category above.
                </td>
              </tr>
            ) : (
              cats.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  {/* Icon + Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: (cat.color ?? '#6B7280') + '25' }}
                      >
                        {cat.icon || '⛪'}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{cat.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <code className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">{cat.slug}</code>
                  </td>

                  {/* Event count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm font-semibold text-white">{countMap[cat.slug] ?? 0}</span>
                  </td>

                  {/* Visibility badge */}
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      cat.is_visible
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.is_visible ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                      {cat.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <CategoryRowActions
                      id={cat.id}
                      slug={cat.slug}
                      isVisible={cat.is_visible ?? true}
                      isFirst={idx === 0}
                      isLast={idx === cats.length - 1}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">
        Tip: Use the eye icon to hide a category without deleting it. Hidden categories won&apos;t show on the website but existing events keep their category.
      </p>
    </div>
  )
}
