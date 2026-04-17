'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

/** Returns all visible categories ordered by sort_order. Used by public pages. */
export async function getVisibleCategories(): Promise<CategoryRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('categories')
    .select('id, name, slug, icon, color')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}
