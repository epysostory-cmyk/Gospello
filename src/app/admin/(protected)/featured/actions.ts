'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleFeatured(
  id: string,
  table: 'events' | 'churches',
  newVal: boolean
) {
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from(table)
    .update({ is_featured: newVal })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/featured')
}
