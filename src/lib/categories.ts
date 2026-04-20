import { cache } from 'react'
import { createAdminClient } from './supabase/admin'

export interface CategoryInfo {
  name: string
  icon: string | null
  color: string | null
}

export type CategoryMap = Record<string, CategoryInfo>

/**
 * Fetches all categories from the DB and returns a slug → CategoryInfo map.
 * Wrapped in React cache() so multiple server components in the same render
 * share one network round-trip.
 */
export const getCategoryMap = cache(async (): Promise<CategoryMap> => {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('categories')
    .select('name, slug, icon, color')

  const map: CategoryMap = {}
  for (const cat of data ?? []) {
    map[cat.slug] = { name: cat.name, icon: cat.icon, color: cat.color }
  }
  return map
})
