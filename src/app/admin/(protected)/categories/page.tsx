export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import AddCategoryForm from './AddCategoryForm'
import CategoryBulkTable from './CategoryBulkTable'

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

      <CategoryBulkTable cats={cats} countMap={countMap} />

      <p className="text-xs text-gray-600">
        Tip: Use the eye icon to hide a category without deleting it. Hidden categories won&apos;t show on the website but existing events keep their category.
      </p>
    </div>
  )
}
