export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save, MessageSquare, ExternalLink } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveContactSettings } from './actions'

const DEFAULTS = {
  contact_email:             'hello@gospello.com',
  contact_whatsapp:          '2348000000000',
  contact_location:          'Lagos, Nigeria',
  contact_hours:             'Mon – Fri, 9am – 6pm WAT',
  contact_partnership_email: 'partnerships@gospello.com',
  contact_hero_subheadline:  'Questions, feedback, partnership enquiries — our team is ready to help.',
}

const INPUT_CLS =
  'w-full bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-400'

export default async function ContactSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const saved = params.saved === '1'

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('platform_settings')
    .select(
      'contact_email, contact_whatsapp, contact_location, contact_hours, contact_partnership_email, contact_hero_subheadline',
    )
    .eq('id', 'default')
    .single()

  const s = {
    contact_email:             (data as Record<string, string> | null)?.contact_email             ?? DEFAULTS.contact_email,
    contact_whatsapp:          (data as Record<string, string> | null)?.contact_whatsapp          ?? DEFAULTS.contact_whatsapp,
    contact_location:          (data as Record<string, string> | null)?.contact_location          ?? DEFAULTS.contact_location,
    contact_hours:             (data as Record<string, string> | null)?.contact_hours             ?? DEFAULTS.contact_hours,
    contact_partnership_email: (data as Record<string, string> | null)?.contact_partnership_email ?? DEFAULTS.contact_partnership_email,
    contact_hero_subheadline:  (data as Record<string, string> | null)?.contact_hero_subheadline  ?? DEFAULTS.contact_hero_subheadline,
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-700 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-500">Contact Page</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Contact Page</h1>
        </div>
        <Link
          href="/contact"
          target="_blank"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Preview Page →
        </Link>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Contact page settings saved successfully.
        </div>
      )}

      <form action={saveContactSettings} className="space-y-5">

        {/* Contact Information */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                name="contact_email"
                defaultValue={s.contact_email}
                className={INPUT_CLS}
                placeholder="hello@gospello.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Partnership Email</label>
              <input
                type="email"
                name="contact_partnership_email"
                defaultValue={s.contact_partnership_email}
                className={INPUT_CLS}
                placeholder="partnerships@gospello.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">WhatsApp Number</label>
            <input
              type="text"
              name="contact_whatsapp"
              defaultValue={s.contact_whatsapp}
              className={INPUT_CLS}
              placeholder="2348012345678"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Enter full number with country code, no spaces or symbols (e.g. <span className="text-gray-400">2348012345678</span>). Used to generate your WhatsApp chat link.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
              <input
                type="text"
                name="contact_location"
                defaultValue={s.contact_location}
                className={INPUT_CLS}
                placeholder="Lagos, Nigeria"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Support Hours</label>
              <input
                type="text"
                name="contact_hours"
                defaultValue={s.contact_hours}
                className={INPUT_CLS}
                placeholder="Mon – Fri, 9am – 6pm WAT"
              />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Page Content</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Hero Subheadline</label>
            <textarea
              name="contact_hero_subheadline"
              rows={2}
              defaultValue={s.contact_hero_subheadline}
              className={INPUT_CLS}
            />
            <p className="text-xs text-gray-600 mt-1.5">Shown below the "Get in Touch" heading in the hero</p>
          </div>
        </div>

        {/* Info: Where do submissions go */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📬</span>
            <h2 className="text-sm font-semibold text-amber-300">Where do contact form submissions go?</h2>
          </div>
          <p className="text-sm text-amber-200/70 leading-relaxed">
            All messages submitted through the contact form are saved directly to your database. You can read every submission from the admin panel — no emails needed.
          </p>
          <Link
            href="/admin/contact-submissions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Contact Submissions →
          </Link>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Save Contact Settings
          </button>
        </div>

      </form>
    </div>
  )
}
