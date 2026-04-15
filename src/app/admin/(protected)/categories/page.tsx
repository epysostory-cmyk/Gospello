export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Tag, Plus } from 'lucide-react'

export default async function AdminCategoriesPage() {
  const adminClient = createAdminClient()

  const { data: categories } = await adminClient
    .from('categories')
    .select('id, name, slug, description, icon, created_at')
    .order('name')

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Categories</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage event categories and taxonomy</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!categories || categories.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400 text-sm">No categories yet</p>
          </div>
        ) : (
          categories.map((cat: any) => (
            <div key={cat.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/8 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">ID: {cat.slug}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
