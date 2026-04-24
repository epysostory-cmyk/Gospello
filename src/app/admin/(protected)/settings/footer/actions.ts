'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface FooterColumn {
  heading: string
  links: { label: string; url: string }[]
}

export interface FooterSettings {
  site_logo_url: string | null
  footer_tagline: string
  footer_columns: FooterColumn[]
  footer_social: {
    instagram: string
    twitter: string
    facebook: string
    youtube: string
    tiktok: string
    whatsapp: string
  }
  footer_copyright: string
  footer_contact_email: string
  footer_bottom_links: { label: string; url: string }[]
}

const FOOTER_DEFAULTS: FooterSettings = {
  site_logo_url: null,
  footer_tagline: "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
  footer_columns: [
    { heading: 'Explore', links: [{ label: 'Events', url: '/events' }, { label: 'Categories', url: '/categories' }, { label: 'Churches', url: '/churches' }, { label: 'Organizers', url: '/organizers' }] },
    { heading: 'Company', links: [{ label: 'About Us', url: '/about' }, { label: 'Contact Us', url: '/contact' }] },
  ],
  footer_social: { instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', whatsapp: '' },
  footer_copyright: '© {year} Gospello. All rights reserved.',
  footer_contact_email: 'hello@gospello.com',
  footer_bottom_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Use', url: '/terms' }],
}

/** Safely parse a value that may be a JSON string or already-parsed object */
function parse<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T } catch { return val as unknown as T }
  }
  return val as T
}

export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_logo_url', 'footer_tagline', 'footer_columns', 'footer_social', 'footer_copyright', 'footer_contact_email', 'footer_bottom_links'])

    if (error) return FOOTER_DEFAULTS

    const map: Record<string, unknown> = {}
    for (const row of data ?? []) {
      if (row.key) map[row.key] = row.value
    }

    return {
      site_logo_url: (map['site_logo_url'] as string | null) ?? null,
      footer_tagline: parse<string>(map['footer_tagline'], FOOTER_DEFAULTS.footer_tagline),
      footer_columns: parse<FooterColumn[]>(map['footer_columns'], FOOTER_DEFAULTS.footer_columns),
      footer_social: parse<FooterSettings['footer_social']>(map['footer_social'], FOOTER_DEFAULTS.footer_social),
      footer_copyright: parse<string>(map['footer_copyright'], FOOTER_DEFAULTS.footer_copyright),
      footer_contact_email: parse<string>(map['footer_contact_email'], FOOTER_DEFAULTS.footer_contact_email),
      footer_bottom_links: parse<{ label: string; url: string }[]>(map['footer_bottom_links'], FOOTER_DEFAULTS.footer_bottom_links),
    }
  } catch {
    return FOOTER_DEFAULTS
  }
}

export async function saveFooterSettings(formData: FormData) {
  const admin = createAdminClient()

  const tagline = formData.get('footer_tagline') as string
  const copyright = formData.get('footer_copyright') as string
  const contactEmail = formData.get('footer_contact_email') as string

  const social = {
    instagram: formData.get('social_instagram') as string,
    twitter: formData.get('social_twitter') as string,
    facebook: formData.get('social_facebook') as string,
    youtube: formData.get('social_youtube') as string,
    tiktok: formData.get('social_tiktok') as string,
    whatsapp: formData.get('social_whatsapp') as string,
  }

  // Parse columns from JSON
  const columnsJson = formData.get('footer_columns_json') as string
  let columns: FooterColumn[] = []
  try { columns = JSON.parse(columnsJson) } catch { columns = [] }

  // Parse bottom links
  const bottomLinksJson = formData.get('footer_bottom_links_json') as string
  let bottomLinks: { label: string; url: string }[] = []
  try { bottomLinks = JSON.parse(bottomLinksJson) } catch { bottomLinks = [] }

  const upserts = [
    { key: 'footer_tagline',       value: tagline,                    updated_at: new Date().toISOString() },
    { key: 'footer_copyright',     value: copyright,                  updated_at: new Date().toISOString() },
    { key: 'footer_contact_email', value: contactEmail,               updated_at: new Date().toISOString() },
    { key: 'footer_social',        value: JSON.stringify(social),      updated_at: new Date().toISOString() },
    { key: 'footer_columns',       value: JSON.stringify(columns),     updated_at: new Date().toISOString() },
    { key: 'footer_bottom_links',  value: JSON.stringify(bottomLinks), updated_at: new Date().toISOString() },
  ]

  await admin.from('site_settings').upsert(upserts, { onConflict: 'key' })

  revalidatePath('/', 'layout')
  revalidatePath('/admin/settings/footer')
}
