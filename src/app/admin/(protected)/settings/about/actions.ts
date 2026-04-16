'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveAboutSettings(formData: FormData) {
  const adminClient = createAdminClient()

  const updates = {
    about_hero_headline_1:        formData.get('about_hero_headline_1')        as string,
    about_hero_headline_gradient: formData.get('about_hero_headline_gradient') as string,
    about_hero_subheadline:       formData.get('about_hero_subheadline')       as string,
    about_mission_quote:          formData.get('about_mission_quote')          as string,
    about_stat_1_value:           formData.get('about_stat_1_value')           as string,
    about_stat_1_label:           formData.get('about_stat_1_label')           as string,
    about_stat_1_sub:             formData.get('about_stat_1_sub')             as string,
    about_stat_2_value:           formData.get('about_stat_2_value')           as string,
    about_stat_2_label:           formData.get('about_stat_2_label')           as string,
    about_stat_2_sub:             formData.get('about_stat_2_sub')             as string,
    about_stat_3_value:           formData.get('about_stat_3_value')           as string,
    about_stat_3_label:           formData.get('about_stat_3_label')           as string,
    about_stat_3_sub:             formData.get('about_stat_3_sub')             as string,
    about_story_headline:         formData.get('about_story_headline')         as string,
    about_story_p1:               formData.get('about_story_p1')               as string,
    about_story_p2:               formData.get('about_story_p2')               as string,
    about_story_p3:               formData.get('about_story_p3')               as string,
    about_location:               formData.get('about_location')               as string,
    about_cta_headline_1:         formData.get('about_cta_headline_1')         as string,
    about_cta_headline_gradient:  formData.get('about_cta_headline_gradient')  as string,
    about_cta_subtitle:           formData.get('about_cta_subtitle')           as string,
    updated_at:                   new Date().toISOString(),
  }

  await adminClient
    .from('platform_settings')
    .upsert({ id: 'default', ...updates })

  revalidatePath('/about')
  revalidatePath('/admin/settings/about')
  redirect('/admin/settings/about?saved=1')
}
