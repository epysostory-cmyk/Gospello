'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Building2, Camera, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

export default function ChurchSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [serviceTimes, setServiceTimes] = useState([''])

  const DENOMINATIONS = [
    'Pentecostal','Charismatic','Apostolic','Anglican','Catholic','Methodist',
    'Baptist','Presbyterian','Lutheran','Seventh-day Adventist','Church of God',
    'Foursquare Gospel','Assemblies of God','African Traditional Christian','Evangelical',
    'Reformed','Brethren','Salvation Army','Quaker (Friends)','Interdenominational',
    'Non-denominational','Other',
  ]

  const [form, setForm] = useState({
    name: '',
    lead_pastor: '',
    denomination: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
    service_times: '',
    phone: '',
    website_url: '',
    instagram: '',
    facebook: '',
    description: '',
  })

  useEffect(() => {
    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/auth/login'); return }
        const userId = session.user.id
        const { data: existing } = await supabase
          .from('churches')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle()
        if (existing) { router.replace('/dashboard/church'); return }
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle()
        if (profile) setForm(f => ({ ...f, name: profile.display_name }))
      } catch (err) {
        console.error(err)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'church-assets')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const { url } = await res.json()
    if (url) setLogoUrl(url)
    setLogoUploading(false)
  }

  const addServiceTime = () => setServiceTimes(t => [...t, ''])
  const removeServiceTime = (i: number) => setServiceTimes(t => t.filter((_, idx) => idx !== i))
  const updateServiceTime = (i: number, v: string) => setServiceTimes(t => t.map((s, idx) => idx === i ? v : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logoUrl) { setError('Church logo is required'); return }
    if (!form.name.trim()) { setError('Church name is required'); return }
    if (!form.lead_pastor.trim()) { setError('Lead pastor name is required'); return }
    if (!form.address.trim()) { setError('Church address is required'); return }
    if (!form.city.trim()) { setError('City is required'); return }
    const filledTimes = serviceTimes.filter(t => t.trim())
    if (filledTimes.length === 0) { setError('At least one service time is required'); return }

    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const slug = slugify(form.name)

    const { error: insertError } = await supabase.from('churches').insert({
      profile_id: session.user.id,
      name: form.name.trim(),
      slug,
      lead_pastor: form.lead_pastor.trim(),
      denomination: form.denomination || null,
      logo_url: logoUrl,
      description: form.description.trim() || null,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state,
      country: 'Nigeria',
      service_times: filledTimes.join('\n'),
      website_url: form.website_url.trim() || null,
      phone: form.phone.trim() || null,
      instagram: form.instagram.trim() || null,
      facebook: form.facebook.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    await supabase
      .from('profiles')
      .update({ display_name: form.name.trim(), profile_completed: true })
      .eq('id', session.user.id)

    router.push('/dashboard')
  }

  if (checking) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
    </div>
  )

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your church profile</h1>
        <p className="text-gray-500 mt-1">This will be shown publicly on Gospello. You can edit it any time.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-6 space-y-5">

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Church Logo <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : logoUrl ? (
                  <Image src={logoUrl} alt="Logo" width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <Camera className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {logoUrl ? 'Change logo' : 'Upload church logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">PNG or JPG, square image recommended</p>
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Church name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Church Name <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="e.g. Daystar Christian Centre" className={inputCls} required />
          </div>

          {/* Lead pastor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lead Pastor / Founder <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.lead_pastor} onChange={e => update('lead_pastor', e.target.value)}
              placeholder="e.g. Pastor Sam Adeyemi" className={inputCls} required />
          </div>

          {/* Denomination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Denomination <span className="text-red-400">*</span>
            </label>
            <select value={form.denomination} onChange={e => update('denomination', e.target.value)}
              className={inputCls + ' bg-white'} required>
              <option value="">— Select denomination —</option>
              {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Church Address <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
              placeholder="Street address where services are held" className={inputCls} required />
          </div>

          {/* City / State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-400">*</span></label>
              <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                placeholder="Lagos" className={inputCls} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-400">*</span></label>
              <select value={form.state} onChange={e => update('state', e.target.value)}
                className={inputCls + ' bg-white'}>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Service Times */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Service Times <span className="text-red-400">*</span>
              </label>
              <button type="button" onClick={addServiceTime}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add time
              </button>
            </div>
            <div className="space-y-2">
              {serviceTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={t} onChange={e => updateServiceTime(i, e.target.value)}
                    placeholder="e.g. Sundays 8AM & 10:30AM" className={inputCls + ' flex-1'} />
                  {serviceTimes.length > 1 && (
                    <button type="button" onClick={() => removeServiceTime(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+234 801 234 5678" className={inputCls} />
          </div>

          {/* Website + Instagram + Facebook */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="url" value={form.website_url} onChange={e => update('website_url', e.target.value)}
                placeholder="https://yourchurch.org" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.instagram} onChange={e => update('instagram', e.target.value)}
                  placeholder="@yourchurch" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.facebook} onChange={e => update('facebook', e.target.value)}
                  placeholder="facebook.com/yourchurch" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About Your Church <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Brief description of your church, vision, and community..."
              rows={3} className={inputCls + ' resize-none'} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">You can add a banner photo after setup</p>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creating profile…' : 'Create Church Profile →'}
          </button>
        </div>
      </form>
    </div>
  )
}
