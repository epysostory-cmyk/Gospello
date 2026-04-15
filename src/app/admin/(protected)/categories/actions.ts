'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addCategory(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  if (!name || !slug) return { error: 'Name and slug required' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('categories').insert({ name, slug, description: description || null })
  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const adminClient = createAdminClient()
  await adminClient.from('categories').delete().eq('id', id)
  revalidatePath('/admin/categories')
}
