'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function savePrivacyPolicy(formData: FormData) {
  const content = formData.get('content') as string
  const lastUpdated = formData.get('last_updated') as string

  const admin = createAdminClient()
  await admin
    .from('site_settings')
    .upsert(
      { key: 'privacy_policy_content', value: { content, last_updated: lastUpdated } as unknown as string, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  revalidatePath('/privacy')
  revalidatePath('/admin/settings/privacy')
}

export async function getPrivacyPolicy(): Promise<{ content: string; last_updated: string }> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'privacy_policy_content')
      .maybeSingle()

    if (data?.value && data.value !== 'null') {
      const parsed = data.value as { content?: string; last_updated?: string }
      return {
        content: parsed?.content ?? '',
        last_updated: parsed?.last_updated ?? 'April 2026',
      }
    }
  } catch { /* empty */ }
  return { content: '', last_updated: 'April 2026' }
}
