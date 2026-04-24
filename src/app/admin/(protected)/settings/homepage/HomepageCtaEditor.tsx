'use client'

import { useState, useTransition } from 'react'
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { saveHomepageCtaSettings } from './actions'
import type { HomepageCtaSettings } from './actions'

interface Props {
  initial: HomepageCtaSettings
}

export default function HomepageCtaEditor({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(initial)

  const update = (k: keyof HomepageCtaSettings, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('visible', form.visible ? 'true' : 'false')
    startTransition(async () => {
      await saveHomepageCtaSettings(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const INPUT_CLS = 'w-full bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-400'
  const LABEL_CLS = 'block text-xs font-medium text-gray-700 mb-1.5'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* ── LEFT: editor ── */}
      <form onSubmit={handleSubmit} className="xl:col-span-3 space-y-5">
        {saved && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Homepage CTA saved successfully.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Church CTA Section</h2>
            <button type="button" onClick={() => update('visible', !form.visible)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${form.visible ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.visible ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            {form.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {form.visible ? 'Section is visible on homepage' : 'Section is hidden from homepage'}
          </div>

          <div>
            <label className={LABEL_CLS}>Section heading</label>
            <input type="text" name="heading" value={form.heading}
              onChange={e => update('heading', e.target.value)} className={INPUT_CLS}
              placeholder="Is your church on Gospello?" />
          </div>

          <div>
            <label className={LABEL_CLS}>Description / Subtext</label>
            <textarea name="subtext" rows={3} value={form.subtext}
              onChange={e => update('subtext', e.target.value)} className={INPUT_CLS}
              placeholder="Join churches and organizers..." />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Primary Button (Gold)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Label</label>
              <input type="text" name="button1_label" value={form.button1_label}
                onChange={e => update('button1_label', e.target.value)} className={INPUT_CLS}
                placeholder="Register Your Church" />
            </div>
            <div>
              <label className={LABEL_CLS}>URL</label>
              <input type="text" name="button1_url" value={form.button1_url}
                onChange={e => update('button1_url', e.target.value)} className={INPUT_CLS}
                placeholder="/auth/signup?type=church" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Secondary Button (Ghost)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Label</label>
              <input type="text" name="button2_label" value={form.button2_label}
                onChange={e => update('button2_label', e.target.value)} className={INPUT_CLS}
                placeholder="Post an Event" />
            </div>
            <div>
              <label className={LABEL_CLS}>URL</label>
              <input type="text" name="button2_url" value={form.button2_url}
                onChange={e => update('button2_url', e.target.value)} className={INPUT_CLS}
                placeholder="/auth/signup" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? 'Saving…' : 'Save Homepage CTA'}
          </button>
        </div>
      </form>

      {/* ── RIGHT: preview ── */}
      <div className="xl:col-span-2">
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
          {form.visible ? (
            <div className="bg-slate-950 rounded-2xl p-8 text-white text-center overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl" />
              <div className="relative">
                <h2 className="text-xl font-black mb-2">
                  {form.heading.includes('Gospello')
                    ? <>
                        {form.heading.split('Gospello')[0]}
                        <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Gospello</span>
                        {form.heading.split('Gospello')[1]}
                      </>
                    : form.heading
                  }
                </h2>
                <p className="text-slate-400 text-sm mb-5 max-w-xs mx-auto">{form.subtext}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <span className="bg-amber-400 text-gray-900 font-bold px-5 py-2.5 rounded-xl text-sm">
                    {form.button1_label}
                  </span>
                  <span className="bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm border border-white/10">
                    {form.button2_label}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <EyeOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Section is hidden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
