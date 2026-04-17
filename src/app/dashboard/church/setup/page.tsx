'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Building2 } from 'lucide-react'

export default function ChurchSetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [defaultName, setDefaultName] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    service_times: '',
    website_url: '',
    phone: '',
  })

  useEffect(() => {
    async function check() {
      try {
        // Use getSession (local cookie, faster) — dashboard layout already verified auth server-side
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/auth/login'); return }

        const userId = session.user.id

        // If they already have a church, go to church dashboard
        const { data: existing } = await supabase
          .from('churches')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle()

        if (existing) { router.replace('/dashboard/church'); return }

        // Pre-fill name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle()

        if (profile) {
          setDefaultName(profile.display_name)
          setForm((f) => ({ ...f, name: profile.display_name }))
        }
      } catch (err) {
        console.error('[church/setup] check error:', err)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Church name is required'); return }

    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Not authenticated'); setSaving(false); return }
    const user = session.user

    const slug = slugify(form.name)

    const { error: insertError } = await supabase.from('churches').insert({
      profile_id: user.id,
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      city: form.city,
      state: form.state,
      country: form.country,
      service_times: form.service_times.trim() || null,
      website_url: form.website_url.trim() || null,
      phone: form.phone.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Also update profile display_name if name changed
    if (form.name.trim() !== defaultName) {
      await supabase
        .from('profiles')
        .update({ display_name: form.name.trim() })
        .eq('id', user.id)
    }

    router.push('/dashboard/church')
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your church profile</h1>
        <p className="text-gray-500 mt-1">
          This information will be shown publicly on Gospello. You can edit it any time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-6 space-y-5">
          {/* Church name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Church name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Daystar Christian Centre"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Brief description of your church, vision, and community..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Street address"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* City / State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Lagos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <select
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Service times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Service times</label>
            <input
              type="text"
              value={form.service_times}
              onChange={(e) => update('service_times', e.target.value)}
              placeholder="e.g. Sundays 8am & 10:30am, Wednesdays 6pm"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Website & phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => update('website_url', e.target.value)}
                placeholder="https://yourchurch.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">You can add a logo and banner after setup</p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creating profile…' : 'Create church profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
