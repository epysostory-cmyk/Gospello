'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface SiteSettings {
  site_logo_url: string | null
  site_favicon_url: string | null
  site_name: string
}

const DEFAULTS: SiteSettings = {
  site_logo_url: null,
  site_favicon_url: null,
  site_name: 'Gospello',
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('site_settings')
      .select('key, value')

    if (error || !data) return DEFAULTS

    const map: Record<string, string> = {}
    for (const row of data) {
      if (row.key && row.value !== null) map[row.key] = row.value
    }

    return {
      site_logo_url: map['site_logo_url'] ?? null,
      site_favicon_url: map['site_favicon_url'] ?? null,
      site_name: map['site_name'] ?? 'Gospello',
    }
  } catch {
    return DEFAULTS
  }
}

export async function updateSiteSetting(key: string, value: string) {
  const admin = createAdminClient()
  await admin
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings')
}
