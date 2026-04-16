'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveHeroSettings(formData: FormData) {
  const adminClient = createAdminClient()

  const updates = {
    hero_badge:             formData.get('hero_badge') as string,
    hero_headline_1:        formData.get('hero_headline_1') as string,
    hero_headline_gradient: formData.get('hero_headline_gradient') as string,
    hero_headline_3:        formData.get('hero_headline_3') as string,
    hero_subheadline:       formData.get('hero_subheadline') as string,
    hero_popular_searches:  formData.get('hero_popular_searches') as string,
    hero_cta_primary:       formData.get('hero_cta_primary') as string,
    hero_cta_secondary:     formData.get('hero_cta_secondary') as string,
    footer_tagline:         formData.get('footer_tagline') as string,
    updated_at:             new Date().toISOString(),
  }

  await adminClient
    .from('platform_settings')
    .upsert({ id: 'default', ...updates })

  revalidatePath('/')
  revalidatePath('/admin/settings/hero')
  redirect('/admin/settings/hero?saved=1')
}
