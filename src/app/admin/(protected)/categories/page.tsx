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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4 sm:px-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Event Categories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {cats.length} total · {visibleCount} visible
            </p>
          </div>
          <AddCategoryForm />
        </div>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Hiding a category removes it from the site without deleting events in it.
        </p>
      </div>

      {/* List */}
      <div className="px-0 sm:px-4 sm:pt-4 sm:max-w-3xl sm:mx-auto">
        <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm overflow-hidden">
          <CategoryBulkTable cats={cats} countMap={countMap} />
        </div>
      </div>
    </div>
  )
}
