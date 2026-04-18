'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addCategory(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string

  if (!name || !slug) return { error: 'Name and slug are required' }
  if (!icon) return { error: 'Please choose an icon' }

  const adminClient = createAdminClient()

  // Get current max sort_order
  const { data: maxRow } = await adminClient
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (maxRow?.sort_order ?? 0) + 1

  const { error } = await adminClient.from('categories').insert({
    name,
    slug,
    description: description || null,
    icon,
    color: color || '#6B7280',
    is_visible: true,
    sort_order: sortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const adminClient = createAdminClient()

  // Get the slug so we can reassign events
  const { data: cat } = await adminClient
    .from('categories')
    .select('slug')
    .eq('id', id)
    .single()

  if (cat && cat.slug !== 'other') {
    // Reassign any events in this category to 'other'
    await adminClient
      .from('events')
      .update({ category: 'other' })
      .eq('category', cat.slug)
  }

  await adminClient.from('categories').delete().eq('id', id)
  revalidatePath('/admin/categories')
}

export async function toggleCategoryVisibility(id: string, currentValue: boolean) {
  const adminClient = createAdminClient()
  await adminClient
    .from('categories')
    .update({ is_visible: !currentValue })
    .eq('id', id)
  revalidatePath('/admin/categories')
}

export async function bulkDeleteCategories(ids: string[]) {
  if (!ids.length) return
  const adminClient = createAdminClient()

  // Reassign events for each non-'other' category being deleted
  const { data: cats } = await adminClient
    .from('categories')
    .select('slug')
    .in('id', ids)

  const slugsToReassign = (cats ?? []).map(c => c.slug).filter(s => s !== 'other')
  if (slugsToReassign.length) {
    await adminClient
      .from('events')
      .update({ category: 'other' })
      .in('category', slugsToReassign)
  }

  await adminClient.from('categories').delete().in('id', ids)
  revalidatePath('/admin/categories')
}

export async function bulkSetCategoryVisibility(ids: string[], visible: boolean) {
  if (!ids.length) return
  const adminClient = createAdminClient()
  await adminClient
    .from('categories')
    .update({ is_visible: visible })
    .in('id', ids)
  revalidatePath('/admin/categories')
}

export async function updateCategory(
  id: string,
  oldSlug: string,
  data: { name: string; slug: string; description: string; icon: string; color: string }
) {
  if (!data.name) return { error: 'Name is required' }
  if (!data.slug) return { error: 'Slug is required' }
  if (!data.icon) return { error: 'Please choose an icon' }
  if (!/^[a-z0-9-]+$/.test(data.slug)) return { error: 'Slug can only contain lowercase letters, numbers, and hyphens' }

  const adminClient = createAdminClient()

  // If slug changed, reassign events and check for conflicts
  if (data.slug !== oldSlug) {
    const { data: existing } = await adminClient
      .from('categories')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle()
    if (existing) return { error: 'A category with this slug already exists' }

    await adminClient.from('events').update({ category: data.slug }).eq('category', oldSlug)
  }

  const { error } = await adminClient
    .from('categories')
    .update({ name: data.name, slug: data.slug, description: data.description || null, icon: data.icon, color: data.color })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}

export async function updateSortOrder(id: string, direction: 'up' | 'down') {
  const adminClient = createAdminClient()

  const { data: cats } = await adminClient
    .from('categories')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })

  if (!cats) return

  const idx = cats.findIndex(c => c.id === id)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= cats.length) return

  const a = cats[idx]
  const b = cats[swapIdx]

  await Promise.all([
    adminClient.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id),
    adminClient.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id),
  ])

  revalidatePath('/admin/categories')
}
