export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveHeroSettings } from './actions'

const DEFAULTS = {
  hero_badge:             "Nigeria's Gospel Event Platform",
  hero_headline_1:        'Discover Every',
  hero_headline_gradient: 'Gospel Event',
  hero_headline_3:        'Near You',
  hero_subheadline:       'Worship nights, conferences, prayer gatherings, youth programs and more — across all 36 Nigerian states and beyond.',
  hero_popular_searches:  'Worship,Lagos,Conference,Prayer,Youth',
  hero_cta_primary:       'Explore Events',
  hero_cta_secondary:     'Post an Event',
  footer_tagline:         "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
}

const INPUT_CLS =
  'w-full bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-600'

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
    .select(
      'hero_badge, hero_headline_1, hero_headline_gradient, hero_headline_3, hero_subheadline, hero_popular_searches, hero_cta_primary, hero_cta_secondary, footer_tagline',
    )
    .eq('id', 'default')
    .single()

  const s = {
    hero_badge:             data?.hero_badge             ?? DEFAULTS.hero_badge,
    hero_headline_1:        data?.hero_headline_1        ?? DEFAULTS.hero_headline_1,
    hero_headline_gradient: data?.hero_headline_gradient ?? DEFAULTS.hero_headline_gradient,
    hero_headline_3:        data?.hero_headline_3        ?? DEFAULTS.hero_headline_3,
    hero_subheadline:       data?.hero_subheadline       ?? DEFAULTS.hero_subheadline,
    hero_popular_searches:  data?.hero_popular_searches  ?? DEFAULTS.hero_popular_searches,
    hero_cta_primary:       data?.hero_cta_primary       ?? DEFAULTS.hero_cta_primary,
    hero_cta_secondary:     data?.hero_cta_secondary     ?? DEFAULTS.hero_cta_secondary,
    footer_tagline:         data?.footer_tagline         ?? DEFAULTS.footer_tagline,
  }

  const popularTags = s.hero_popular_searches.split(',').map((t: string) => t.trim()).filter(Boolean)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-300 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-300">Hero Section</span>
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">Hero Section</h1>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Preview Site →
        </Link>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Hero settings saved successfully.
        </div>
      )}

      <form action={saveHeroSettings} className="space-y-5">

        {/* Badge & Headline */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Badge &amp; Headline</h2>

          {/* Badge */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Badge Text</label>
            <input
              type="text"
              name="hero_badge"
              defaultValue={s.hero_badge}
              className={INPUT_CLS}
            />
          </div>

          {/* Headline lines */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Headline Line 1 (white)</label>
              <input
                type="text"
                name="hero_headline_1"
                defaultValue={s.hero_headline_1}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Headline Line 2 (gold gradient)</label>
              <input
                type="text"
                name="hero_headline_gradient"
                defaultValue={s.hero_headline_gradient}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Headline Line 3 (light grey)</label>
              <input
                type="text"
                name="hero_headline_3"
                defaultValue={s.hero_headline_3}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Subheadline */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Subheadline</label>
            <textarea
              name="hero_subheadline"
              rows={3}
              defaultValue={s.hero_subheadline}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">CTA Buttons</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Primary Button (gold)</label>
              <input
                type="text"
                name="hero_cta_primary"
                defaultValue={s.hero_cta_primary}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Secondary Button (ghost)</label>
              <input
                type="text"
                name="hero_cta_secondary"
                defaultValue={s.hero_cta_secondary}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Popular Searches</h2>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              name="hero_popular_searches"
              defaultValue={s.hero_popular_searches}
              className={INPUT_CLS}
            />
            <p className="text-xs text-gray-600 mt-1.5">
              These appear as quick-search pills below the search bar
            </p>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Footer Brand Text</h2>
            <p className="text-xs text-gray-500 mt-0.5">The description shown in the bottom-left of the footer</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Footer Tagline</label>
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
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Live Preview</h2>
          <div className="bg-slate-950 rounded-xl p-6 space-y-3 overflow-hidden">
            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-xs px-3 py-1.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              <span className="text-slate-300">{s.hero_badge}</span>
            </div>

            {/* Headline */}
            <div className="text-2xl font-black leading-tight tracking-tight">
              <span className="text-white">{s.hero_headline_1}</span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                {s.hero_headline_gradient}
              </span>
              <br />
              <span className="text-slate-300">{s.hero_headline_3}</span>
            </div>

            {/* Subheadline */}
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{s.hero_subheadline}</p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-xs">
                {s.hero_cta_primary}
              </span>
              <span className="inline-flex items-center bg-white/8 text-white font-semibold px-4 py-2 rounded-lg text-xs border border-white/10">
                {s.hero_cta_secondary}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-slate-600">Popular:</span>
              {popularTags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Save Hero Settings
          </button>
        </div>
      </form>
    </div>
  )
}
