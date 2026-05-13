export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveHeroSettings } from './actions'

const DEFAULTS = {
  hero_badge:             'Events · Churches · All 36 States',
  hero_headline_1:        'Find gospel events',
  hero_headline_gradient: 'near you',
  hero_headline_3:        '',
  hero_subheadline:       'Worship nights, conferences, prayer gatherings, youth programs and more — across all 36 Nigerian states.',
  hero_popular_searches:  'Worship,Lagos,Conference,Prayer,Youth',
  footer_tagline:         "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
}

const INPUT_CLS =
  'w-full bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-400'

export default async function HeroSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const saved = params.saved === '1'

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('platform_settings')
    .select('hero_badge, hero_headline_1, hero_headline_gradient, hero_headline_3, hero_subheadline, hero_popular_searches, footer_tagline')
    .eq('id', 'default')
    .single()

  const s = {
    hero_badge:             data?.hero_badge             ?? DEFAULTS.hero_badge,
    hero_headline_1:        data?.hero_headline_1        ?? DEFAULTS.hero_headline_1,
    hero_headline_gradient: data?.hero_headline_gradient ?? DEFAULTS.hero_headline_gradient,
    hero_headline_3:        data?.hero_headline_3        ?? DEFAULTS.hero_headline_3,
    hero_subheadline:       data?.hero_subheadline       ?? DEFAULTS.hero_subheadline,
    hero_popular_searches:  data?.hero_popular_searches  ?? DEFAULTS.hero_popular_searches,
    footer_tagline:         data?.footer_tagline         ?? DEFAULTS.footer_tagline,
  }

  const popularTags = s.hero_popular_searches.split(',').map((t: string) => t.trim()).filter(Boolean)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-700 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-500">Hero Section</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Hero Section</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Preview Site →
        </Link>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Hero settings saved.
        </div>
      )}

      <form action={saveHeroSettings} className="space-y-5">

        {/* Badge */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Badge</h2>
            <p className="text-xs text-gray-500 mt-0.5">Small pill shown above the headline. Sets context at a glance.</p>
          </div>
          <div>
            <input
              type="text"
              name="hero_badge"
              defaultValue={s.hero_badge}
              className={INPUT_CLS}
              placeholder="Events · Churches · All 36 States"
            />
            <p className="text-xs text-gray-400 mt-1">Keep it short — 3–6 words.</p>
          </div>
        </div>

        {/* Headline */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Headline</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The headline is built from three parts:{' '}
              <span className="font-medium text-gray-700">Part 1</span>{' '}
              + <span className="font-medium text-indigo-600">Gradient (coloured)</span>{' '}
              + <span className="font-medium text-gray-700">Part 3</span>.
              Part 3 is optional.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Part 1 — plain text</label>
            <input
              type="text"
              name="hero_headline_1"
              defaultValue={s.hero_headline_1}
              className={INPUT_CLS}
              placeholder="Find gospel events"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Gradient part — coloured text</label>
            <input
              type="text"
              name="hero_headline_gradient"
              defaultValue={s.hero_headline_gradient}
              className={INPUT_CLS}
              placeholder="near you"
            />
            <p className="text-xs text-gray-400 mt-1">This part renders in indigo-to-violet gradient.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Part 3 — optional plain text</label>
            <input
              type="text"
              name="hero_headline_3"
              defaultValue={s.hero_headline_3}
              className={INPUT_CLS}
              placeholder="Leave empty if not needed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Subheadline</label>
            <textarea
              name="hero_subheadline"
              rows={3}
              defaultValue={s.hero_subheadline}
              className={INPUT_CLS}
              placeholder="Worship nights, conferences..."
            />
            <p className="text-xs text-gray-400 mt-1">The smaller description text below the headline.</p>
          </div>
        </div>

        {/* Quick search tags */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Quick Search Tags</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              name="hero_popular_searches"
              defaultValue={s.hero_popular_searches}
              className={INPUT_CLS}
              placeholder="Worship,Lagos,Conference,Prayer,Youth"
            />
            <p className="text-xs text-gray-400 mt-1">Appear as quick-tap links below the search bar. e.g. Worship,Lagos,Conference</p>
          </div>
        </div>

        {/* Footer tagline */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Footer Tagline</h2>
            <p className="text-xs text-gray-500 mt-0.5">The brand description shown in the site footer.</p>
          </div>
          <textarea
            name="footer_tagline"
            rows={3}
            defaultValue={s.footer_tagline}
            className={INPUT_CLS}
            placeholder="Nigeria's home for Christian events..."
          />
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
          <div className="bg-white border border-gray-100 rounded-xl px-8 py-10 text-center space-y-3 overflow-hidden">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-gray-400 border border-gray-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {s.hero_badge}
            </div>
            {/* Headline */}
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {s.hero_headline_1}{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {s.hero_headline_gradient}
              </span>
              {s.hero_headline_3 && <span> {s.hero_headline_3}</span>}
            </p>
            {/* Subheadline */}
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">{s.hero_subheadline}</p>
            {/* Quick tags */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">This weekend</span>
              <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">Find a church</span>
              {popularTags.slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-[11px] font-medium text-indigo-600">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 pt-1">
              Running an event? <span className="text-indigo-600 font-semibold">Post it free →</span>
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}
