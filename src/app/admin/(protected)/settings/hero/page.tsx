export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveHeroSettings } from './actions'

const DEFAULTS = {
  hero_headline_1:       'Find gospel events near you',
  hero_subheadline:      'Worship nights, conferences, prayer gatherings, youth programs and more — across all 36 Nigerian states.',
  hero_popular_searches: 'Worship,Lagos,Conference,Prayer,Youth',
  footer_tagline:        "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
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
    .select('hero_headline_1, hero_subheadline, hero_popular_searches, footer_tagline')
    .eq('id', 'default')
    .single()

  const s = {
    hero_headline_1:       data?.hero_headline_1       ?? DEFAULTS.hero_headline_1,
    hero_subheadline:      data?.hero_subheadline      ?? DEFAULTS.hero_subheadline,
    hero_popular_searches: data?.hero_popular_searches ?? DEFAULTS.hero_popular_searches,
    footer_tagline:        data?.footer_tagline        ?? DEFAULTS.footer_tagline,
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

        {/* Headline & Copy */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Headline &amp; Copy</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Headline</label>
            <input
              type="text"
              name="hero_headline_1"
              defaultValue={s.hero_headline_1}
              className={INPUT_CLS}
              placeholder="Find gospel events near you"
            />
            <p className="text-xs text-gray-400 mt-1">The large heading shown at the top of the homepage.</p>
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

        {/* Popular Searches */}
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

        {/* Footer Brand */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Footer Tagline</h2>
            <p className="text-xs text-gray-500 mt-0.5">The brand description shown in the footer.</p>
          </div>
          <div>
            <textarea
              name="footer_tagline"
              rows={3}
              defaultValue={s.footer_tagline}
              className={INPUT_CLS}
              placeholder="Nigeria's home for Christian events..."
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3 overflow-hidden">
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {s.hero_headline_1}
            </p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">{s.hero_subheadline}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-gray-400">Try:</span>
              {popularTags.map((tag: string) => (
                <span key={tag} className="text-xs font-medium text-indigo-600">{tag}</span>
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
