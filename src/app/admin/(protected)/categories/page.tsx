export const dynamic = 'force-dynamic'

import { requireAdminRole } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import AddCategoryForm from './AddCategoryForm'
import CategoryBulkTable from './CategoryBulkTable'

export default async function AdminCategoriesPage() {
  await requireAdminRole(['super_admin'])
  const adminClient = createAdminClient()

  const [{ data: categories }, { data: eventCounts }] = await Promise.all([
    adminClient.from('categories').select('id, name, slug, description, icon, color, is_visible, sort_order').order('sort_order', { ascending: true }),
    adminClient.from('events').select('category').eq('status', 'approved'),
  ])

  const countMap: Record<string, number> = {}
  for (const ev of eventCounts ?? []) {
    if (ev.category) countMap[ev.category] = (countMap[ev.category] ?? 0) + 1
  }

  const cats = categories ?? []
  const visibleCount = cats.filter(c => c.is_visible).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Event Categories</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {cats.length} total &mdash; {visibleCount} visible on the website
            </p>
          </div>
          <AddCategoryForm />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Hiding a category removes it from the website without deleting it. Events in that category keep their tag.
        </p>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <CategoryBulkTable cats={cats} countMap={countMap} />
      </div>
    </div>
  )
}
