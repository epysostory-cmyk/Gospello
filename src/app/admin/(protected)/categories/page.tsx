export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import AddCategoryForm from './AddCategoryForm'
import CategoryBulkTable from './CategoryBulkTable'

export default async function AdminCategoriesPage() {
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Event Categories</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {cats.length} categories · {cats.filter(c => c.is_visible).length} visible on website
          </p>
        </div>
        <AddCategoryForm />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <CategoryBulkTable cats={cats} countMap={countMap} />
      </div>

      <p className="text-xs text-gray-400">
        Tip: Use the eye icon to hide a category without deleting it. Hidden categories won&apos;t show on the website but existing events keep their category.
      </p>
    </div>
  )
}
