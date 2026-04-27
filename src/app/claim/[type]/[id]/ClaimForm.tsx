'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitClaim } from './actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  profileId: string
  profileType: 'church' | 'organizer'
  profileName: string
}

const ROLE_OPTIONS = [
  'Pastor / Senior Pastor',
  'Associate Pastor',
  'Church Administrator',
  'Deacon / Elder',
  'Ministry Leader',
  'Event Organizer',
  'Communications Officer',
  'Other',
]

export default function ClaimForm({ profileId, profileType, profileName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    claimant_name: '',
    claimant_role: '',
    claimant_role_other: '',
    claimant_phone: '',
    verification_notes: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 leading-relaxed">
          Your claim for <strong className="text-gray-700">{profileName}</strong> is under review. We&apos;ll get back to you within 2–3 business days.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.claimant_name.trim())                                       { setError('Your full name is required'); return }
    if (!form.claimant_role)                                              { setError('Please select your role'); return }
    if (form.claimant_role === 'Other' && !form.claimant_role_other.trim()) { setError('Please specify your role'); return }
    if (!form.claimant_phone.trim())                                      { setError('Phone number is required'); return }
    if (!form.verification_notes.trim())                                  { setError('Verification notes are required'); return }

    startTransition(async () => {
      const resolvedRole = form.claimant_role === 'Other' ? form.claimant_role_other.trim() : form.claimant_role
      const res = await submitClaim({ profileId, profileType, ...form, claimant_role: resolvedRole })
      if (res.error) { setError(res.error); return }
      setSubmitted(true)
    })
  }

  const inputCls = `
    w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900
    placeholder-gray-400 bg-white outline-none
    focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10
    transition-all duration-150
  `

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Full Name */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
          Your Full Name <span className="text-red-500">*</span>
        </label>
        <input
          value={form.claimant_name}
          onChange={e => set('claimant_name', e.target.value)}
          placeholder={`e.g. Pastor ${profileType === 'church' ? 'John Adeyemi' : 'Tunde Bello'}`}
          className={inputCls}
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
          Your Role at this {profileType === 'church' ? 'Church' : 'Organisation'} <span className="text-red-500">*</span>
        </label>
        <select
          value={form.claimant_role}
          onChange={e => set('claimant_role', e.target.value)}
          className={inputCls}
          style={{ appearance: 'auto' }}
        >
          <option value="">Select your role</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {form.claimant_role === 'Other' && (
          <input
            value={form.claimant_role_other}
            onChange={e => set('claimant_role_other', e.target.value)}
            placeholder="Please specify your role…"
            className={`${inputCls} mt-2`}
          />
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={form.claimant_phone}
          onChange={e => set('claimant_phone', e.target.value)}
          placeholder="+234 800 000 0000"
          className={inputCls}
        />
      </div>

      {/* Verification Notes */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
          Verification Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.verification_notes}
          onChange={e => set('verification_notes', e.target.value)}
          rows={4}
          placeholder="Tell us how we can verify your affiliation — e.g. social media handles, website, reference contact…"
          className={`${inputCls} resize-none`}
        />
        <p className="text-[11px] text-gray-400 mt-1.5">The more detail you provide, the faster we can verify your claim.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold
          flex items-center justify-center gap-2
          transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          'Submit Claim Request'
        )}
      </button>
    </form>
  )
}
