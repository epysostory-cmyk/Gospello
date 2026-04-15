'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveGeneralSettings(_formData: FormData) {
  // In a real app, save to DB. For now just revalidate.
  revalidatePath('/admin/settings')
  redirect('/admin/settings?saved=1')
}

export async function saveNotificationSettings(_formData: FormData) {
  revalidatePath('/admin/settings')
  redirect('/admin/settings?saved=1')
}

export async function saveSecuritySettings(_formData: FormData) {
  revalidatePath('/admin/settings')
  redirect('/admin/settings?saved=1')
}
