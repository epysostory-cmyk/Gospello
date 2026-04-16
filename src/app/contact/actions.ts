'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function submitContactForm(formData: FormData) {
  const name    = (formData.get('name')    as string | null)?.trim() ?? ''
  const email   = (formData.get('email')   as string | null)?.trim() ?? ''
  const subject = (formData.get('subject') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''

  if (!name || !email || !subject || !message) {
    redirect('/contact?error=missing_fields')
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('contact_submissions')
    .insert({ name, email, subject, message, status: 'unread' })

  if (error) {
    console.error('Contact submission error:', error)
    redirect('/contact?error=submit_failed')
  }

  redirect('/contact?sent=1')
}
