'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveContactSettings(formData: FormData) {
  const adminClient = createAdminClient()

  const updates = {
    contact_email:             formData.get('contact_email')             as string,
    contact_whatsapp:          formData.get('contact_whatsapp')          as string,
    contact_location:          formData.get('contact_location')          as string,
    contact_hours:             formData.get('contact_hours')             as string,
    contact_partnership_email: formData.get('contact_partnership_email') as string,
    contact_hero_subheadline:  formData.get('contact_hero_subheadline')  as string,
    updated_at:                new Date().toISOString(),
  }

  await adminClient
    .from('platform_settings')
    .upsert({ id: 'default', ...updates })

  revalidatePath('/contact')
  revalidatePath('/admin/settings/contact')
  redirect('/admin/settings/contact?saved=1')
}
