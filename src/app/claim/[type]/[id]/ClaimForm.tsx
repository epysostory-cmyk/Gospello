'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitClaim } from './actions'

interface Props {
  profileId: string
  profileType: 'church' | 'organizer'
  profileName: string
}

const ROLE_OPTIONS = ['Pastor / Senior Pastor', 'Associate Pastor', 'Church Administrator', 'Deacon / Elder', 'Ministry Leader', 'Event Organizer', 'Communications Officer', 'Other']

export default function ClaimForm({ profileId, profileType, profileName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    claimant_name: '',
    claimant_role: '',
    claimant_phone: '',
    verification_notes: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your claim for <strong>{profileName}</strong> is under review. We'll get back to you within 2–3 business days.
        </p>
        <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          Go back
        </button>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.claimant_name.trim()) { setError('Your full name is required'); return }
    if (!form.claimant_role) { setError('Please select your role'); return }
    if (!form.claimant_phone.trim()) { setError('Phone number is required'); return }
    if (!form.verification_notes.trim()) { setError('Verification notes are required'); return }

    startTransition(async () => {
      const res = await submitClaim({ profileId, profileType, ...form })
      if (res.error) { setError(res.error); return }
      setSubmitted(true)
    })
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 bg-white'
  const labelCls = 'block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Your Full Name <span className="text-red-500">*</span></label>
        <input value={form.claimant_name} onChange={e => set('claimant_name', e.target.value)} placeholder="e.g. Pastor John Adeyemi" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Your Role at this {profileType === 'church' ? 'Church' : 'Organisation'} <span className="text-red-500">*</span></label>
        <select value={form.claimant_role} onChange={e => set('claimant_role', e.target.value)} className={inputCls}>
          <option value="">Select your role</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
        <input type="tel" value={form.claimant_phone} onChange={e => set('claimant_phone', e.target.value)} placeholder="+234 800 000 0000" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Verification Notes <span className="text-red-500">*</span></label>
        <textarea
          value={form.verification_notes}
          onChange={e => set('verification_notes', e.target.value)}
          rows={3}
          placeholder="Tell us how we can verify your affiliation (e.g. social media handles, website, reference contact)…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <button type="submit" disabled={isPending}
        className="w-full h-11 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {isPending ? 'Submitting…' : 'Submit Claim Request'}
      </button>
    </form>
  )
}
