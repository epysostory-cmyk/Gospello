'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mic2, CheckCircle, MapPin, Phone, Globe, Link2, ArrowLeft, Eye, EyeOff, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { NIGERIAN_STATES } from '@/lib/utils'
import { createAdminProfile } from './actions'

const DENOMINATIONS = [
  'Pentecostal', 'Charismatic', 'Apostolic', 'Anglican', 'Catholic', 'Methodist',
  'Baptist', 'Presbyterian', 'Lutheran', 'Seventh-day Adventist', 'Church of God',
  'Foursquare Gospel', 'Assemblies of God', 'African Traditional Christian', 'Evangelical',
  'Reformed', 'Brethren', 'Salvation Army', 'Quaker (Friends)', 'Interdenominational',
  'Non-denominational', 'Other',
]

const MINISTRY_TYPES = [
  'Evangelism Ministry', 'Worship Ministry', 'Prayer Ministry', 'Youth Ministry',
  'Children Ministry', 'Women Ministry', 'Men Ministry', 'Campus Ministry',
  'Music Ministry', 'Media Ministry', 'Prophetic Ministry', 'Healing and Deliverance Ministry',
  'Discipleship Ministry', 'Missions and Outreach Ministry', 'Marriage and Family Ministry',
  'Singles Ministry', 'Leadership and Mentorship Ministry', 'Business and Marketplace Ministry',
  'Creative Arts Ministry', 'Drama and Theatre Ministry', 'Dance Ministry', 'Podcast Ministry',
  'Conference and Events Ministry', 'Charity and Community Ministry', 'Prison Ministry',
  'Hospital and Healthcare Ministry', 'Sports Ministry', 'Tech and Digital Ministry', 'Other',
]

interface Props { adminId: string }

export default function CreateProfileForm({ adminId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [accountType, setAccountType] = useState<'church' | 'organizer'>('church')
  const [visible, setVisible]         = useState(true)
  const [error, setError]             = useState('')
  const [logoUrl, setLogoUrl]         = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const [form, setForm] = useState({
    name: '', slug: '', city: '', state: 'Lagos', address: '',
    phone: '', website: '', instagram: '', facebook: '',
    description: '', source_url: '',
    // church-specific
    pastor_name: '', denomination: '',
    service_times: [''],
    // organizer-specific
    contact_person: '', ministry_type: '',
  })

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2 MB'); return }
    setLogoPreview(URL.createObjectURL(file))
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'profile-logos')
      fd.append('path', `${Date.now()}-${file.name}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) setLogoUrl(json.url)
      else setError('Logo upload failed')
    } catch {
      setError('Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  function set(key: keyof typeof form, value: string | string[]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && typeof value === 'string') {
        next.slug = value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
      }
      return next
    })
  }

  function addServiceTime() { setForm(p => ({ ...p, service_times: [...p.service_times, ''] })) }
  function setServiceTime(i: number, v: string) {
    setForm(p => { const s = [...p.service_times]; s[i] = v; return { ...p, service_times: s } })
  }
  function removeServiceTime(i: number) {
    setForm(p => ({ ...p, service_times: p.service_times.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Profile name is required'); return }
    if (!form.city.trim()) { setError('City is required'); return }
    if (accountType === 'church' && !form.pastor_name.trim()) { setError('Lead pastor name is required'); return }
    if (accountType === 'organizer' && !form.contact_person.trim()) { setError('Contact person is required'); return }

    startTransition(async () => {
      const result = await createAdminProfile({
        adminId,
        accountType,
        visible,
        logoUrl,
        form: {
          ...form,
          service_times: form.service_times.filter(s => s.trim()),
        },
      })
      if (result.error) { setError(result.error); return }
      router.push('/admin/profiles')
    })
  }

  const initial = form.name ? form.name[0].toUpperCase() : '?'

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Unclaimed Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a church or organizer that hasn&apos;t signed up yet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: form ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Logo upload */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4">
                {accountType === 'church' ? 'Church Logo' : 'Profile Image / Ministry Logo'}
              </p>
              <div className="flex flex-col items-center gap-3">
                {/* 120px circular preview */}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="relative w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#7C3AED] transition-colors bg-gray-50 group"
                >
                  {logoUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : (logoPreview || logoUrl) ? (
                    <Image
                      src={logoPreview ?? logoUrl!}
                      alt="Logo preview"
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                      unoptimized={!!logoPreview}
                    />
                  ) : (
                    <span className="text-4xl">{accountType === 'church' ? '⛪' : '🎤'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full flex items-center justify-center">
                    {!logoUploading && (logoPreview || logoUrl) && (
                      <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                  >
                    {logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Recommended: Square image, min 200×200px</p>
                  <p className="text-xs text-gray-400">JPG, PNG or WEBP · max 2 MB</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>

          {/* Account type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">Account Type <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-3">
                {([['church', '⛪', 'Church', 'For congregations and churches'] as const,
                   ['organizer', '🎤', 'Organizer', 'For event organizers and ministries'] as const]).map(([type, icon, label, desc]) => (
                  <button key={type} type="button" onClick={() => setAccountType(type)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      accountType === type ? 'border-[#7C3AED] bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        {accountType === type && <CheckCircle className="w-3.5 h-3.5 text-[#7C3AED]" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">Basic Information</p>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {accountType === 'church' ? 'Church Name' : 'Organization Name'} <span className="text-red-500">*</span>
                </label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder={accountType === 'church' ? 'e.g. House of Glory Assembly' : 'e.g. Fire & Grace Ministries'}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20" />
                {form.slug && <p className="text-xs text-gray-400 mt-1">gospello.com/{accountType === 'church' ? 'churches' : 'organizers'}/{form.slug}</p>}
              </div>

              {/* Church-specific */}
              {accountType === 'church' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Lead Pastor / Founder <span className="text-red-500">*</span></label>
                    <input value={form.pastor_name} onChange={e => set('pastor_name', e.target.value)}
                      placeholder="e.g. Pastor John Doe"
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Denomination</label>
                    <select value={form.denomination} onChange={e => set('denomination', e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] bg-white">
                      <option value="">— Select denomination —</option>
                      {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Service Times</label>
                    {form.service_times.map((st, i) => (
                      <div key={i} className="flex gap-2 mt-1.5">
                        <input value={st} onChange={e => setServiceTime(i, e.target.value)}
                          placeholder="e.g. Sundays 8AM & 10AM"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                        {form.service_times.length > 1 && (
                          <button type="button" onClick={() => removeServiceTime(i)} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addServiceTime} className="mt-2 text-xs font-semibold text-[#7C3AED] hover:underline">+ Add service time</button>
                  </div>
                </>
              )}

              {/* Organizer-specific */}
              {accountType === 'organizer' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Person <span className="text-red-500">*</span></label>
                    <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
                      placeholder="e.g. Jane Adewale"
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Ministry / Organization Type</label>
                    <select value={form.ministry_type} onChange={e => set('ministry_type', e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] bg-white">
                      <option value="">— Select type —</option>
                      {MINISTRY_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">Location</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">State <span className="text-red-500">*</span></label>
                  <select value={form.state} onChange={e => set('state', e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#7C3AED] bg-white">
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">City <span className="text-red-500">*</span></label>
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="e.g. Lagos"
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Address <span className="text-red-500">*</span></label>
                <input value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="e.g. 14 Bode Thomas Street, Surulere"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
              </div>
            </div>

            {/* Contact & Social */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">Contact &amp; Social</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'phone',     Icon: Phone,     label: 'Phone',     placeholder: '+234 800 000 0000' },
                  { key: 'website',   Icon: Globe,     label: 'Website',   placeholder: 'https://example.com' },
                  { key: 'instagram', Icon: Link2, label: 'Instagram', placeholder: '@handle or full URL' },
                  { key: 'facebook',  Icon: Link2, label: 'Facebook',  placeholder: 'facebook.com/page' },
                ].map(({ key, Icon, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</label>
                    <div className="relative mt-1.5">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={form[key as keyof typeof form] as string} onChange={e => set(key as keyof typeof form, e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About & Source */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">About &amp; Source</p>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Short Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} maxLength={300} placeholder="Brief description of this church or ministry..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] resize-none" />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/300</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Source URL</label>
                <input value={form.source_url} onChange={e => set('source_url', e.target.value)}
                  placeholder="e.g. instagram.com/p/... or facebook.com/..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED]" />
                <p className="text-xs text-gray-400 mt-1">Where did you find this church/organizer?</p>
              </div>
            </div>

            {/* Visibility + Submit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Visibility</p>
                  <p className="text-xs text-gray-500 mt-0.5">Show on website immediately after saving</p>
                </div>
                <button type="button" onClick={() => setVisible(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${visible ? 'bg-[#7C3AED]' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}

              <div className="flex items-center gap-3">
                <button type="submit" disabled={isPending}
                  className="flex-1 h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending ? 'Saving…' : 'Save Profile'}
                </button>
                <button type="button" onClick={() => router.back()}
                  className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-900 relative">
                  <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  {/* Unverified badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-gray-800/80 text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    <span>Unverified</span>
                  </div>
                </div>
                {/* Logo */}
                <div className="px-4 -mt-7 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl overflow-hidden">
                    {(logoPreview || logoUrl) ? (
                      <Image src={logoPreview ?? logoUrl!} alt="Logo" width={56} height={56} className="w-full h-full object-cover" unoptimized={!!logoPreview} />
                    ) : (
                      accountType === 'church' ? '⛪' : '🎤'
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <h2 className="text-base font-bold text-gray-900 truncate">{form.name || 'Profile Name'}</h2>
                  {(form.city || form.state) && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{[form.city, form.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {form.description && <p className="text-xs text-gray-600 mt-2 line-clamp-3">{form.description}</p>}
                  {accountType === 'church' && form.pastor_name && (
                    <p className="text-xs text-gray-500 mt-2">👨‍💼 {form.pastor_name}</p>
                  )}
                  {accountType === 'organizer' && form.contact_person && (
                    <p className="text-xs text-gray-500 mt-2">📞 {form.contact_person}</p>
                  )}
                  {/* Claim card preview */}
                  <div className="mt-3 p-3 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50">
                    <p className="text-xs font-semibold text-violet-700">{accountType === 'church' ? '🏛️' : '🎤'} Is this your {accountType === 'church' ? 'church' : 'ministry'}?</p>
                    <p className="text-[10px] text-violet-600 mt-0.5">Claim this profile to manage your events</p>
                    <div className="mt-2 inline-block bg-[#7C3AED] text-white text-[10px] font-semibold px-3 py-1 rounded-lg">Claim This Profile →</div>
                  </div>
                  {/* Visibility indicator */}
                  <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-medium ${visible ? 'text-green-600' : 'text-gray-400'}`}>
                    {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {visible ? 'Visible on website' : 'Hidden from website'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
