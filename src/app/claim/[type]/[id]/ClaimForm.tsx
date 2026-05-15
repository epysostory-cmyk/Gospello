'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitClaim } from './actions'
import { Loader2, CheckCircle2, Clock, Mail, ArrowRight } from 'lucide-react'

interface Props {
  profileId: string
  profileType: 'church' | 'organizer'
  profileName: string
  userEmail?: string
}

const ROLE_OPTIONS_CHURCH = [
  'Senior Pastor / Lead Pastor',
  'Associate Pastor',
  'Church Administrator',
  'Deacon / Elder',
  'Ministry Leader',
  'Communications Officer',
  'Event Organizer',
  'Other',
]

const ROLE_OPTIONS_ORG = [
  'Founder / Director',
  'Event Organizer',
  'Communications Officer',
  'Administrator',
  'Team Lead',
  'Other',
]

export default function ClaimForm({ profileId, profileType, profileName, userEmail }: Props) {
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

  const roleOptions = profileType === 'church' ? ROLE_OPTIONS_CHURCH : ROLE_OPTIONS_ORG
  const typeName = profileType === 'church' ? 'church' : 'organisation'

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="py-2">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">You&apos;re all set</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Your claim for <span className="font-semibold text-gray-700">{profileName}</span> has been submitted.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What happens next</p>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">We review within 2–3 days</p>
              <p className="text-xs text-gray-500 mt-0.5">Our team checks the details you provided</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">We email you the result</p>
              {userEmail && (
                <p className="text-xs text-gray-500 mt-0.5">We&apos;ll reach you at <span className="font-medium">{userEmail}</span></p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Full access unlocked</p>
              <p className="text-xs text-gray-500 mt-0.5">Edit profile, post events, and more</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full h-11 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors"
        >
          Back to profile
        </button>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.claimant_name.trim())                                            { setError('Please enter your full name'); return }
    if (!form.claimant_role)                                                   { setError('Please select your role'); return }
    if (form.claimant_role === 'Other' && !form.claimant_role_other.trim())    { setError('Please tell us your role'); return }
    if (!form.claimant_phone.trim())                                           { setError('Please enter a phone number'); return }
    if (!form.verification_notes.trim())                                       { setError('Please add a few details so we can verify you'); return }

    startTransition(async () => {
      const resolvedRole = form.claimant_role === 'Other' ? form.claimant_role_other.trim() : form.claimant_role
      const res = await submitClaim({ profileId, profileType, ...form, claimant_role: resolvedRole })
      if (res.error) { setError(res.error); return }
      setSubmitted(true)
    })
  }

  const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900
    placeholder-gray-400 bg-white outline-none
    focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10
    transition-all duration-150`

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Your full name
        </label>
        <input
          value={form.claimant_name}
          onChange={e => set('claimant_name', e.target.value)}
          placeholder="e.g. Pastor John Adeyemi"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Your role at this {typeName}
        </label>
        <select
          value={form.claimant_role}
          onChange={e => set('claimant_role', e.target.value)}
          className={inputCls}
          style={{ appearance: 'auto' }}
        >
          <option value="">Select your role…</option>
          {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {form.claimant_role === 'Other' && (
          <input
            value={form.claimant_role_other}
            onChange={e => set('claimant_role_other', e.target.value)}
            placeholder="What's your title?"
            className={`${inputCls} mt-2`}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Phone number
        </label>
        <input
          type="tel"
          value={form.claimant_phone}
          onChange={e => set('claimant_phone', e.target.value)}
          placeholder="+234 800 000 0000"
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-1.5">In case we need to reach you quickly</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          How can we confirm you&apos;re affiliated?
        </label>
        <textarea
          value={form.verification_notes}
          onChange={e => set('verification_notes', e.target.value)}
          rows={4}
          placeholder={
            profileType === 'church'
              ? "e.g. I'm listed on our church website at gracechapel.org/team — you can also call our admin on 0812 345 6789 or check our Facebook page @GraceChapelLagos"
              : "e.g. I run our events page at eventsbytunde.com — our Instagram is @EventsByTunde and our team can be reached at 0812 345 6789"
          }
          className={`${inputCls} resize-none leading-relaxed`}
        />
        <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">Tip:</span> Mention your church website, social media page, or another staff member we can contact. The more you give us, the faster we approve.
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

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
          'Submit my claim'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        We typically respond within 2–3 business days
      </p>

    </form>
  )
}
