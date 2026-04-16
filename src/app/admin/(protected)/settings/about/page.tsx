export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save, Heart } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveAboutSettings } from './actions'

const DEFAULTS = {
  about_hero_headline_1:        'Built for the',
  about_hero_headline_gradient: 'Body of Christ',
  about_hero_subheadline:       "Gospello is Nigeria's central platform for discovering Christian events and churches — helping believers find what God is doing around them, one event at a time.",
  about_mission_quote:          "To connect every believer in Nigeria with the gospel events and churches that will transform their faith.",
  about_stat_1_value:           '36',
  about_stat_1_label:           'Nigerian States',
  about_stat_1_sub:             'Coverage',
  about_stat_2_value:           '100%',
  about_stat_2_label:           'Free to Use',
  about_stat_2_sub:             'For attendees',
  about_stat_3_value:           '2025',
  about_stat_3_label:           'Founded',
  about_stat_3_sub:             'Est. Nigeria',
  about_story_headline:         'Born out of a simple question',
  about_story_p1:               '"Where are the gospel events happening near me?" — that question had no great answer for Nigerian believers. Event posters floated across WhatsApp groups. Church programs were hidden in bulletins. Great gatherings went unattended simply because no one knew.',
  about_story_p2:               'Gospello was built to change that. A single, trusted platform where churches post their events, organizers reach their audience, and every believer can discover what God is doing in their city — for free.',
  about_story_p3:               'We launched in 2025 with a vision to reach every state in Nigeria and beyond, powered by the belief that the gospel deserves the best technology.',
  about_location:               'Lagos, Nigeria — and growing',
  about_cta_headline_1:         'Ready to',
  about_cta_headline_gradient:  'get involved?',
  about_cta_subtitle:           'Discover events happening near you, or post your own for thousands of believers to find.',
}

const INPUT_CLS =
  'w-full bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-600'

export default async function AboutSettingsPage({
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
      'about_hero_headline_1, about_hero_headline_gradient, about_hero_subheadline, about_mission_quote, about_stat_1_value, about_stat_1_label, about_stat_1_sub, about_stat_2_value, about_stat_2_label, about_stat_2_sub, about_stat_3_value, about_stat_3_label, about_stat_3_sub, about_story_headline, about_story_p1, about_story_p2, about_story_p3, about_location, about_cta_headline_1, about_cta_headline_gradient, about_cta_subtitle',
    )
    .eq('id', 'default')
    .single()

  const s = {
    about_hero_headline_1:        (data as Record<string, string> | null)?.about_hero_headline_1        ?? DEFAULTS.about_hero_headline_1,
    about_hero_headline_gradient: (data as Record<string, string> | null)?.about_hero_headline_gradient ?? DEFAULTS.about_hero_headline_gradient,
    about_hero_subheadline:       (data as Record<string, string> | null)?.about_hero_subheadline       ?? DEFAULTS.about_hero_subheadline,
    about_mission_quote:          (data as Record<string, string> | null)?.about_mission_quote          ?? DEFAULTS.about_mission_quote,
    about_stat_1_value:           (data as Record<string, string> | null)?.about_stat_1_value           ?? DEFAULTS.about_stat_1_value,
    about_stat_1_label:           (data as Record<string, string> | null)?.about_stat_1_label           ?? DEFAULTS.about_stat_1_label,
    about_stat_1_sub:             (data as Record<string, string> | null)?.about_stat_1_sub             ?? DEFAULTS.about_stat_1_sub,
    about_stat_2_value:           (data as Record<string, string> | null)?.about_stat_2_value           ?? DEFAULTS.about_stat_2_value,
    about_stat_2_label:           (data as Record<string, string> | null)?.about_stat_2_label           ?? DEFAULTS.about_stat_2_label,
    about_stat_2_sub:             (data as Record<string, string> | null)?.about_stat_2_sub             ?? DEFAULTS.about_stat_2_sub,
    about_stat_3_value:           (data as Record<string, string> | null)?.about_stat_3_value           ?? DEFAULTS.about_stat_3_value,
    about_stat_3_label:           (data as Record<string, string> | null)?.about_stat_3_label           ?? DEFAULTS.about_stat_3_label,
    about_stat_3_sub:             (data as Record<string, string> | null)?.about_stat_3_sub             ?? DEFAULTS.about_stat_3_sub,
    about_story_headline:         (data as Record<string, string> | null)?.about_story_headline         ?? DEFAULTS.about_story_headline,
    about_story_p1:               (data as Record<string, string> | null)?.about_story_p1               ?? DEFAULTS.about_story_p1,
    about_story_p2:               (data as Record<string, string> | null)?.about_story_p2               ?? DEFAULTS.about_story_p2,
    about_story_p3:               (data as Record<string, string> | null)?.about_story_p3               ?? DEFAULTS.about_story_p3,
    about_location:               (data as Record<string, string> | null)?.about_location               ?? DEFAULTS.about_location,
    about_cta_headline_1:         (data as Record<string, string> | null)?.about_cta_headline_1         ?? DEFAULTS.about_cta_headline_1,
    about_cta_headline_gradient:  (data as Record<string, string> | null)?.about_cta_headline_gradient  ?? DEFAULTS.about_cta_headline_gradient,
    about_cta_subtitle:           (data as Record<string, string> | null)?.about_cta_subtitle           ?? DEFAULTS.about_cta_subtitle,
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-300 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-300">About Page</span>
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">About Page</h1>
        </div>
        <Link
          href="/about"
          target="_blank"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Preview Page →
        </Link>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          About page settings saved successfully.
        </div>
      )}

      <form action={saveAboutSettings} className="space-y-5">

        {/* Hero Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">Hero Section</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Headline — White Part
              </label>
              <input
                type="text"
                name="about_hero_headline_1"
                defaultValue={s.about_hero_headline_1}
                className={INPUT_CLS}
                placeholder="Built for the"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Headline — Gold Gradient Part
              </label>
              <input
                type="text"
                name="about_hero_headline_gradient"
                defaultValue={s.about_hero_headline_gradient}
                className={INPUT_CLS}
                placeholder="Body of Christ"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Hero Subheadline</label>
            <textarea
              name="about_hero_subheadline"
              rows={3}
              defaultValue={s.about_hero_subheadline}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Mission Statement */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Mission Statement &amp; Stats</h2>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Mission Quote</label>
            <textarea
              name="about_mission_quote"
              rows={3}
              defaultValue={s.about_mission_quote}
              className={INPUT_CLS}
              placeholder="To connect every believer..."
            />
            <p className="text-xs text-gray-600 mt-1.5">Displayed in quotes on the mission card</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">Stats (shown below the mission quote)</p>
            <div className="space-y-2">
              {/* Stat headers */}
              <div className="grid grid-cols-3 gap-3">
                <p className="text-xs text-gray-600 px-1">Value</p>
                <p className="text-xs text-gray-600 px-1">Label</p>
                <p className="text-xs text-gray-600 px-1">Sub-label</p>
              </div>
              {/* Stat 1 */}
              <div className="grid grid-cols-3 gap-3">
                <input type="text" name="about_stat_1_value" defaultValue={s.about_stat_1_value} className={INPUT_CLS} placeholder="36" />
                <input type="text" name="about_stat_1_label" defaultValue={s.about_stat_1_label} className={INPUT_CLS} placeholder="Nigerian States" />
                <input type="text" name="about_stat_1_sub"   defaultValue={s.about_stat_1_sub}   className={INPUT_CLS} placeholder="Coverage" />
              </div>
              {/* Stat 2 */}
              <div className="grid grid-cols-3 gap-3">
                <input type="text" name="about_stat_2_value" defaultValue={s.about_stat_2_value} className={INPUT_CLS} placeholder="100%" />
                <input type="text" name="about_stat_2_label" defaultValue={s.about_stat_2_label} className={INPUT_CLS} placeholder="Free to Use" />
                <input type="text" name="about_stat_2_sub"   defaultValue={s.about_stat_2_sub}   className={INPUT_CLS} placeholder="For attendees" />
              </div>
              {/* Stat 3 */}
              <div className="grid grid-cols-3 gap-3">
                <input type="text" name="about_stat_3_value" defaultValue={s.about_stat_3_value} className={INPUT_CLS} placeholder="2025" />
                <input type="text" name="about_stat_3_label" defaultValue={s.about_stat_3_label} className={INPUT_CLS} placeholder="Founded" />
                <input type="text" name="about_stat_3_sub"   defaultValue={s.about_stat_3_sub}   className={INPUT_CLS} placeholder="Est. Nigeria" />
              </div>
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Our Story Section</h2>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Story Headline</label>
            <input
              type="text"
              name="about_story_headline"
              defaultValue={s.about_story_headline}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Paragraph 1</label>
            <textarea
              name="about_story_p1"
              rows={4}
              defaultValue={s.about_story_p1}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Paragraph 2</label>
            <textarea
              name="about_story_p2"
              rows={4}
              defaultValue={s.about_story_p2}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Paragraph 3</label>
            <textarea
              name="about_story_p3"
              rows={3}
              defaultValue={s.about_story_p3}
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Location (shown in the gradient info card)
            </label>
            <input
              type="text"
              name="about_location"
              defaultValue={s.about_location}
              className={INPUT_CLS}
              placeholder="Lagos, Nigeria — and growing"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Bottom CTA Section</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                CTA Headline — White Part
              </label>
              <input
                type="text"
                name="about_cta_headline_1"
                defaultValue={s.about_cta_headline_1}
                className={INPUT_CLS}
                placeholder="Ready to"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                CTA Headline — Gold Gradient Part
              </label>
              <input
                type="text"
                name="about_cta_headline_gradient"
                defaultValue={s.about_cta_headline_gradient}
                className={INPUT_CLS}
                placeholder="get involved?"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">CTA Subtitle</label>
            <textarea
              name="about_cta_subtitle"
              rows={2}
              defaultValue={s.about_cta_subtitle}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Save About Settings
          </button>
        </div>

      </form>
    </div>
  )
}
