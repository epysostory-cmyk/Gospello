'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Mic2, ArrowLeft, ChevronDown } from 'lucide-react'
import { NIGERIAN_STATES, CATEGORY_LABELS } from '@/lib/utils'
import { createAdminEvent } from './actions'

type ProfileType = 'church' | 'seeded_org'
interface Profile { id: string; name: string; city: string; state: string; logo_url: string|null; profileType: ProfileType }
interface Props { adminId: string; profiles: Profile[] }

export default function AdminEventForm({ adminId, profiles }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [selectedProfile, setSelectedProfile] = useState<Profile|null>(null)
  const [profileSearch, setProfileSearch]     = useState('')
  const [showProfileList, setShowProfileList] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', category: 'worship',
    start_date: '', start_time: '09:00', end_date: '', end_time: '',
    is_online: false, online_platform: '', online_link: '',
    location_name: '', address: '', city: '', state: 'Lagos',
    registration_type: 'free_no_registration' as 'free_no_registration'|'free_registration'|'paid',
    price: '', currency: 'NGN', payment_link: '',
    rsvp_required: false, capacity: '', tags: [] as string[],
    source_url: '',
  })

  const set = (k: string, v: string|boolean|string[]) => setForm(p => ({ ...p, [k]: v }))

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
    p.city.toLowerCase().includes(profileSearch.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedProfile) { setError('Please select a profile'); return }
    if (!form.title.trim()) { setError('Event title is required'); return }
    if (!form.start_date)  { setError('Start date is required'); return }

    startTransition(async () => {
      const result = await createAdminEvent({ adminId, selectedProfile, form })
      if (result.error) { setError(result.error); return }
      router.push('/admin/events')
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Event</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create an event under any profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Profile selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
          <label className={labelCls}>Which profile is hosting this event? <span className="text-red-500">*</span></label>

          {selectedProfile ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#7C3AED] bg-violet-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-white border border-gray-200 flex-shrink-0">
                  {selectedProfile.profileType === 'church' ? '⛪' : '🎤'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedProfile.name}</p>
                  <p className="text-xs text-gray-500">{[selectedProfile.city, selectedProfile.state].filter(Boolean).join(', ')} · {selectedProfile.profileType === 'church' ? 'Church' : 'Organizer'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedProfile(null)} className="text-xs text-gray-400 hover:text-gray-700">Change</button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Search by name or city..."
                  value={profileSearch} onChange={e => setProfileSearch(e.target.value)}
                  onFocus={() => setShowProfileList(true)}
                  className={`${inputCls} pl-9 pr-9`}
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {showProfileList && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                  {filteredProfiles.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No profiles found</p>
                  ) : filteredProfiles.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedProfile(p); setShowProfileList(false); setProfileSearch('') }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-gray-100 flex-shrink-0">
                        {p.profileType === 'church' ? '⛪' : '🎤'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{[p.city, p.state].filter(Boolean).join(', ')}</p>
                      </div>
                      <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${p.profileType==='church'?'bg-violet-100 text-violet-700':'bg-blue-100 text-blue-700'}`}>
                        {p.profileType==='church'?'Church':'Organizer'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event basics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Event Details</p>
          <div>
            <label className={labelCls}>Event Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Annual Worship Concert 2025" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe the event..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Date & time */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Date &amp; Time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Location</p>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_online} onChange={e => set('is_online', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED]" />
              Online event
            </label>
          </div>
          {form.is_online ? (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Platform</label>
                <select value={form.online_platform} onChange={e => set('online_platform', e.target.value)} className={inputCls}>
                  <option value="">Select platform</option>
                  {['Zoom','Google Meet','YouTube Live','Facebook Live','Instagram Live','Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Meeting Link</label>
                <input value={form.online_link} onChange={e => set('online_link', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Venue Name <span className="text-red-500">*</span></label>
                <input value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. National Stadium Surulere" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls}>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registration */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Registration &amp; Entry</p>
          <div>
            <label className={labelCls}>Registration Type</label>
            <div className="space-y-2">
              {([['free_no_registration','Free – No registration needed'],['free_registration','Free – Registration required'],['paid','Paid event']] as const).map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="regType" value={val} checked={form.registration_type === val} onChange={() => set('registration_type', val)} className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm text-gray-700">{lbl}</span>
                </label>
              ))}
            </div>
          </div>
          {form.registration_type === 'paid' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Price (₦)</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payment Link</label>
                <input value={form.payment_link} onChange={e => set('payment_link', e.target.value)} placeholder="https://paystack.com/..." className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Source URL (optional)</label>
            <input value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="e.g. instagram post, flyer link" className={inputCls} />
          </div>
        </div>

        {/* Error + Submit */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
        <div className="flex items-center gap-3 pb-6">
          <button type="submit" disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'Creating…' : 'Create Event'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="h-11 px-5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
