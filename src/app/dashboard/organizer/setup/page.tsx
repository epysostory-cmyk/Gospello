'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, User2 } from 'lucide-react'

export default function OrganizerSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const MINISTRY_TYPES = [
    'Evangelism Ministry','Worship Ministry','Prayer Ministry','Youth Ministry',
    'Children Ministry','Women Ministry','Men Ministry','Campus Ministry',
    'Music Ministry','Media Ministry','Prophetic Ministry','Healing and Deliverance Ministry',
    'Discipleship Ministry','Missions and Outreach Ministry','Marriage and Family Ministry',
    'Singles Ministry','Leadership and Mentorship Ministry','Business and Marketplace Ministry',
    'Creative Arts Ministry','Drama and Theatre Ministry','Dance Ministry','Podcast Ministry',
    'Conference and Events Ministry','Charity and Community Ministry','Prison Ministry',
    'Hospital and Healthcare Ministry','Sports Ministry','Tech and Digital Ministry','Other',
  ]

  const [form, setForm] = useState({ display_name: '', bio: '', state: 'Lagos', website: '', ministry_type: '' })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, bio, state, website, profile_completed, account_type')
        .eq('id', session.user.id)
        .maybeSingle()
      if (profile?.profile_completed) { router.replace('/dashboard'); return }
      if (profile?.account_type !== 'organizer') { router.replace('/dashboard'); return }
      setForm(f => ({
        ...f,
        display_name: profile?.display_name ?? '',
        bio: profile?.bio ?? '',
        state: profile?.state ?? 'Lagos',
        website: profile?.website ?? '',
      }))
      setChecking(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || null,
        state: form.state,
        website: form.website.trim() || null,
        ministry_type: form.ministry_type || null,
        profile_completed: true,
      })
      .eq('id', session.user.id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/dashboard')
  }

  if (checking) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <User2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
        <p className="text-gray-500 mt-1">Tell us about yourself to get started on Gospello.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => update('display_name', e.target.value)}
              placeholder="e.g. Tunde Bello"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Ministry type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ministry Type <span className="text-red-400">*</span>
            </label>
            <select
              value={form.ministry_type}
              onChange={e => update('ministry_type', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              <option value="">— Select ministry type —</option>
              {MINISTRY_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Tell attendees a bit about yourself..."
              rows={3}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <select
                value={form.state}
                onChange={e => update('state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                value={form.website}
                onChange={e => update('website', e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Complete Setup →'}
          </button>
        </div>
      </form>
    </div>
  )
}
