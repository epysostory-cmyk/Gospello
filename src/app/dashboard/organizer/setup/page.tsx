'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NIGERIAN_STATES } from '@/lib/utils'
import { Loader2, Phone, Globe, Link2, ChevronRight, ChevronLeft } from 'lucide-react'
import BackButton from '@/components/ui/BackButton'
import OrganizerTypeChips from '@/components/ui/OrganizerTypeChips'

const DRAFT_KEY = 'gospello_organizer_setup_draft'

const STEPS = [
  { label: 'Basic Info',        required: ['display_name'] },
  { label: 'Location',          required: ['state', 'city'] },
  { label: 'Contact & Social',  required: [] },
  { label: 'About',             required: [] },
]

type Form = {
  display_name: string
  contact_person: string
  ministry_types: string[]
  state: string
  city: string
  address: string
  phone: string
  whatsapp: string
  website: string
  instagram: string
  facebook: string
  twitter: string
  youtube: string
  bio: string
}

export default function OrganizerSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [resumePrompt, setResumePrompt] = useState(false)

  const [form, setForm] = useState<Form>({
    display_name: '', contact_person: '', ministry_types: [],
    state: 'Lagos', city: '', address: '',
    phone: '', whatsapp: '', website: '', instagram: '',
    facebook: '', twitter: '', youtube: '',
    bio: '',
  })

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

      // Check for saved draft
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          setResumePrompt(true)
        } else {
          setForm(f => ({
            ...f,
            display_name: profile?.display_name ?? '',
            bio: profile?.bio ?? '',
            state: profile?.state ?? 'Lagos',
            website: profile?.website ?? '',
          }))
        }
      } catch {
        setForm(f => ({
          ...f,
          display_name: profile?.display_name ?? '',
          bio: profile?.bio ?? '',
          state: profile?.state ?? 'Lagos',
          website: profile?.website ?? '',
        }))
      }

      setChecking(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      setForm(prev => ({ ...prev, ...saved.form }))
      if (saved.step) setStep(saved.step)
    } catch { /* ignore */ }
    setResumePrompt(false)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setResumePrompt(false)
  }

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }))
    } catch { /* ignore */ }
  }, [form, step])

  useEffect(() => {
    if (checking) return
    const id = setInterval(saveDraft, 60_000)
    return () => clearInterval(id)
  }, [checking, saveDraft])

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'state') next.city = ''
      return next
    })
    setFieldErrors(prev => { const n = { ...prev }; delete n[k as string]; return n })
  }

  function validate(s: number): Record<string, string> {
    const errs: Record<string, string> = {}
    if (s === 0 && !form.display_name.trim()) errs.display_name = 'Full name is required'
    if (s === 1) {
      if (!form.state) errs.state = 'State is required'
      if (!form.city) errs.city = 'City is required'
    }
    return errs
  }

  function handleNext() {
    const errs = validate(step)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setStep(s => s + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(step)
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    if (!form.display_name.trim()) { setError('Full name is required'); return }

    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const { error: err } = await supabase.from('profiles').update({
      display_name:    form.display_name.trim(),
      contact_person:  form.contact_person.trim() || null,
      ministry_types:  form.ministry_types.length > 0 ? form.ministry_types : null,
      state:           form.state,
      city:            form.city || null,
      address:         form.address.trim() || null,
      phone:           form.phone.trim() || null,
      whatsapp:        form.whatsapp.trim() || null,
      website:         form.website.trim() || null,
      instagram:       form.instagram.trim() || null,
      facebook:        form.facebook.trim() || null,
      twitter:         form.twitter.trim() || null,
      youtube:         form.youtube.trim() || null,
      bio:             form.bio.trim() || null,
      profile_completed: true,
    }).eq('id', session.user.id)

    if (err) { setError(err.message); setSaving(false); return }
    localStorage.removeItem(DRAFT_KEY)
    router.push('/dashboard')
  }

  if (checking) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <BackButton />

      {/* Resume prompt */}
      {resumePrompt && (
        <div className="mb-6 p-4 rounded-2xl bg-violet-50 border border-violet-200">
          <p className="text-sm font-semibold text-violet-900">You have an unfinished profile. Continue where you left off?</p>
          <div className="flex gap-3 mt-3">
            <button onClick={loadDraft} className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold">Continue</button>
            <button onClick={discardDraft} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Start fresh</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
        <p className="text-gray-500 mt-1">Tell us about yourself to get started on Gospello.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              i < step ? 'bg-[#7C3AED] text-white' : i === step ? 'bg-[#7C3AED] text-white ring-4 ring-[#7C3AED]/20' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${i < step ? 'bg-[#7C3AED]' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{STEPS[step].label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
          </div>

          <div className="px-6 py-6 space-y-5">

            {/* Step 0 — Basic Info */}
            {step === 0 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={e => update('display_name', e.target.value)}
                    placeholder="e.g. John Adewale"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] ${fieldErrors.display_name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {fieldErrors.display_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.display_name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Contact Person <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={e => update('contact_person', e.target.value)}
                    placeholder="e.g. Jane Adewale"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    What Best Describes You?
                  </label>
                  <OrganizerTypeChips
                    value={form.ministry_types}
                    onChange={v => update('ministry_types', v)}
                  />
                </div>
              </>
            )}

            {/* Step 1 — Location */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    State <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.state}
                    onChange={e => update('state', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] bg-white ${fieldErrors.state ? 'border-red-400' : 'border-gray-200'}`}
                  >
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldErrors.state && <p className="text-xs text-red-500 mt-1">{fieldErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                    placeholder="e.g. Lekki"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {fieldErrors.city && <p className="text-xs text-red-500 mt-1">{fieldErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Address <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder="e.g. 14 Bode Thomas Street, Surulere"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                  />
                </div>
              </>
            )}

            {/* Step 2 — Contact & Social */}
            {step === 2 && (
              <>
                {([
                  { key: 'phone',     Icon: Phone, label: 'Phone',       placeholder: '+234 800 000 0000', type: 'tel' },
                  { key: 'whatsapp',  Icon: Phone, label: 'WhatsApp',    placeholder: '+234 800 000 0000', type: 'tel' },
                  { key: 'website',   Icon: Globe, label: 'Website',     placeholder: 'https://example.com', type: 'url' },
                  { key: 'instagram', Icon: Link2, label: 'Instagram',   placeholder: '@handle or full URL', type: 'text' },
                  { key: 'facebook',  Icon: Link2, label: 'Facebook',    placeholder: 'facebook.com/page', type: 'text' },
                  { key: 'twitter',   Icon: Link2, label: 'Twitter / X', placeholder: '@handle or full URL', type: 'text' },
                  { key: 'youtube',   Icon: Link2, label: 'YouTube',     placeholder: 'youtube.com/channel', type: 'text' },
                ] as const).map(({ key, Icon, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={type}
                        value={form[key]}
                        onChange={e => update(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Step 3 — About */}
            {step === 3 && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Short Description <span className="text-xs font-normal text-gray-400 normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => update('bio', e.target.value)}
                  placeholder="Brief description of this organizer..."
                  rows={5}
                  maxLength={300}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/300</p>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          </div>

          {/* Footer nav — sticky on mobile */}
          <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-gray-100 flex gap-3 sm:relative sm:bottom-auto">
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setFieldErrors({}); setStep(s => s - 1) }}
                className="flex items-center gap-1.5 px-4 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Complete Setup →'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
