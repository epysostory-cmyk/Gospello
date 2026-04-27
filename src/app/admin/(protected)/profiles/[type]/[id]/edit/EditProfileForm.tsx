'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { NIGERIAN_STATES } from '@/lib/utils'
import { updateAdminChurch, updateAdminOrganizer } from './actions'

const DENOMINATIONS = [
  'Pentecostal', 'Charismatic', 'Apostolic', 'Anglican', 'Catholic', 'Methodist',
  'Baptist', 'Presbyterian', 'Lutheran', 'Seventh-day Adventist', 'Church of God',
  'Foursquare Gospel', 'Assemblies of God', 'African Traditional Christian', 'Evangelical',
  'Reformed', 'Brethren', 'Salvation Army', 'Quaker (Friends)', 'Interdenominational',
  'Non-denominational', 'Other',
]

interface ChurchProfile {
  id: string; name: string; logo_url: string | null; description: string | null
  address: string | null; city: string; state: string; phone: string | null
  website_url: string | null; instagram: string | null; facebook: string | null
  pastor_name: string | null; denomination: string | null; service_times: string | null
  source_url: string | null; is_hidden: boolean; slug: string
}

interface OrgProfile {
  id: string; name: string; logo_url: string | null; description: string | null
  address: string | null; city: string; state: string; phone: string | null
  whatsapp: string | null; website: string | null; instagram: string | null
  facebook: string | null; twitter: string | null; youtube: string | null
  contact_person: string | null; ministry_type: string | null
  source_url: string | null; is_hidden: boolean; slug: string
}

type Props =
  | { type: 'church'; profile: ChurchProfile }
  | { type: 'organizer'; profile: OrgProfile }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'

export default function EditProfileForm({ type, profile }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isChurch = type === 'church'
  const church = isChurch ? (profile as ChurchProfile) : null
  const org = !isChurch ? (profile as OrgProfile) : null

  const [form, setForm] = useState(() => isChurch ? {
    name:          church!.name,
    city:          church!.city,
    state:         church!.state,
    address:       church!.address ?? '',
    phone:         church!.phone ?? '',
    website:       church!.website_url ?? '',
    instagram:     church!.instagram ?? '',
    facebook:      church!.facebook ?? '',
    description:   church!.description ?? '',
    source_url:    church!.source_url ?? '',
    pastor_name:   church!.pastor_name ?? '',
    denomination:  church!.denomination ?? '',
    service_times: church!.service_times ? church!.service_times.split('\n') : [''],
    // organizer placeholders
    whatsapp: '', twitter: '', youtube: '', contact_person: '', ministry_type: '',
    is_hidden: church!.is_hidden,
  } : {
    name:           org!.name,
    city:           org!.city,
    state:          org!.state,
    address:        org!.address ?? '',
    phone:          org!.phone ?? '',
    whatsapp:       org!.whatsapp ?? '',
    website:        org!.website ?? '',
    instagram:      org!.instagram ?? '',
    facebook:       org!.facebook ?? '',
    twitter:        org!.twitter ?? '',
    youtube:        org!.youtube ?? '',
    description:    org!.description ?? '',
    source_url:     org!.source_url ?? '',
    contact_person: org!.contact_person ?? '',
    ministry_type:  org!.ministry_type ?? '',
    // church placeholders
    pastor_name: '', denomination: '', service_times: [''],
    is_hidden: org!.is_hidden,
  })

  const set = (key: string, val: string | boolean | string[]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      let result: { error?: string }

      if (isChurch) {
        result = await updateAdminChurch({
          id: profile.id,
          form: {
            name: form.name, city: form.city, state: form.state, address: form.address,
            phone: form.phone, website: form.website, instagram: form.instagram, facebook: form.facebook,
            description: form.description, source_url: form.source_url,
            pastor_name: form.pastor_name, denomination: form.denomination,
            service_times: form.service_times, is_hidden: form.is_hidden,
          },
        })
      } else {
        result = await updateAdminOrganizer({
          id: profile.id,
          form: {
            name: form.name, city: form.city, state: form.state, address: form.address,
            phone: form.phone, whatsapp: form.whatsapp, website: form.website,
            instagram: form.instagram, facebook: form.facebook, twitter: form.twitter,
            youtube: form.youtube, description: form.description, source_url: form.source_url,
            contact_person: form.contact_person, ministry_type: form.ministry_type,
            is_hidden: form.is_hidden,
          },
        })
      }

      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/admin/profiles'), 1200)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/profiles" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Edit {isChurch ? 'Church' : 'Organizer'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{profile.name}</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          Saved successfully! Redirecting…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] divide-y divide-gray-50">

        {/* Basic Info */}
        <section className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Basic Info</h2>
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          {isChurch && (
            <>
              <Field label="Lead Pastor">
                <input className={inputCls} value={form.pastor_name} onChange={e => set('pastor_name', e.target.value)} placeholder="Pastor's name" />
              </Field>
              <Field label="Denomination">
                <select className={inputCls} value={form.denomination} onChange={e => set('denomination', e.target.value)}>
                  <option value="">— Select —</option>
                  {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Service Times">
                {form.service_times.map((t, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={inputCls}
                      value={t}
                      onChange={e => {
                        const next = [...form.service_times]
                        next[i] = e.target.value
                        set('service_times', next)
                      }}
                      placeholder="e.g. Sundays 8:00 AM"
                    />
                    {form.service_times.length > 1 && (
                      <button type="button" onClick={() => set('service_times', form.service_times.filter((_, j) => j !== i))}
                        className="text-xs text-red-500 hover:text-red-700 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => set('service_times', [...form.service_times, ''])}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium">+ Add service time</button>
              </Field>
            </>
          )}
          {!isChurch && (
            <>
              <Field label="Contact Person">
                <input className={inputCls} value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Ministry Type">
                <input className={inputCls} value={form.ministry_type} onChange={e => set('ministry_type', e.target.value)} placeholder="e.g. Youth Ministry" />
              </Field>
            </>
          )}
          <Field label="Description">
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
        </section>

        {/* Location */}
        <section className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State">
              <select className={inputCls} value={form.state} onChange={e => set('state', e.target.value)}>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
        </section>

        {/* Contact & Social */}
        <section className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact & Social</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            {!isChurch && (
              <Field label="WhatsApp">
                <input className={inputCls} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              </Field>
            )}
            <Field label="Website">
              <input className={inputCls} value={form.website} onChange={e => set('website', e.target.value)} />
            </Field>
            <Field label="Instagram">
              <input className={inputCls} value={form.instagram} onChange={e => set('instagram', e.target.value)} />
            </Field>
            <Field label="Facebook">
              <input className={inputCls} value={form.facebook} onChange={e => set('facebook', e.target.value)} />
            </Field>
            {!isChurch && (
              <>
                <Field label="Twitter / X">
                  <input className={inputCls} value={form.twitter} onChange={e => set('twitter', e.target.value)} />
                </Field>
                <Field label="YouTube">
                  <input className={inputCls} value={form.youtube} onChange={e => set('youtube', e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </section>

        {/* Source & Visibility */}
        <section className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Source & Visibility</h2>
          <Field label="Source URL">
            <input className={inputCls} value={form.source_url} onChange={e => set('source_url', e.target.value)} placeholder="https://…" />
          </Field>
          <button
            type="button"
            onClick={() => set('is_hidden', !form.is_hidden)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              form.is_hidden
                ? 'border-gray-300 bg-gray-50 text-gray-600'
                : 'border-violet-300 bg-violet-50 text-violet-700'
            }`}
          >
            {form.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {form.is_hidden ? 'Hidden from public' : 'Visible to public'}
          </button>
        </section>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Link href="/admin/profiles" className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isPending || success}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
