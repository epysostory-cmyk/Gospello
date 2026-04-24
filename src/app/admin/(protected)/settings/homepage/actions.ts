'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface HomepageCtaSettings {
  heading: string
  subtext: string
  button1_label: string
  button1_url: string
  button2_label: string
  button2_url: string
  visible: boolean
}

const DEFAULTS: HomepageCtaSettings = {
  heading: 'Is your church on Gospello?',
  subtext: 'Join churches and organizers reaching more believers by listing your events for free.',
  button1_label: 'Register Your Church',
  button1_url: '/auth/signup?type=church',
  button2_label: 'Post an Event',
  button2_url: '/auth/signup',
  visible: true,
}

export async function getHomepageCtaSettings(): Promise<HomepageCtaSettings> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_church_cta')
      .maybeSingle()

    if (data?.value) {
      // Handle both jsonb (object) and text (JSON string) column types
      let v: Partial<HomepageCtaSettings> = {}
      if (typeof data.value === 'string') {
        try { v = JSON.parse(data.value) } catch { /* use defaults */ }
      } else if (typeof data.value === 'object') {
        v = data.value as Partial<HomepageCtaSettings>
      }
      return {
        heading:      v.heading      ?? DEFAULTS.heading,
        subtext:      v.subtext      ?? DEFAULTS.subtext,
        button1_label: v.button1_label ?? DEFAULTS.button1_label,
        button1_url:  v.button1_url  ?? DEFAULTS.button1_url,
        button2_label: v.button2_label ?? DEFAULTS.button2_label,
        button2_url:  v.button2_url  ?? DEFAULTS.button2_url,
        visible:      v.visible !== false,
      }
    }
  } catch { /* empty */ }
  return DEFAULTS
}

export async function saveHomepageCtaSettings(formData: FormData) {
  const settings: HomepageCtaSettings = {
    heading:      formData.get('heading')      as string,
    subtext:      formData.get('subtext')      as string,
    button1_label: formData.get('button1_label') as string,
    button1_url:  formData.get('button1_url')  as string,
    button2_label: formData.get('button2_label') as string,
    button2_url:  formData.get('button2_url')  as string,
    visible:      formData.get('visible') === 'true',
  }

  const admin = createAdminClient()
  await admin
    .from('site_settings')
    .upsert(
      { key: 'homepage_church_cta', value: settings as unknown as string, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/admin/settings/homepage')
}
