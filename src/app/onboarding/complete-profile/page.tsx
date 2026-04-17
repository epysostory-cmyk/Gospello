'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check } from 'lucide-react'
import type { AccountType } from '@/types/database'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

function needsCompletion(profile: { profile_completed?: boolean; account_type?: string | null; display_name?: string | null } | null): boolean {
  if (!profile) return true
  if (profile.profile_completed) return false
  if (!profile.account_type) return true
  if (!profile.display_name || profile.display_name.trim().length < 3) return true
  if (/^[0-9._@+\-]+$/.test(profile.display_name.trim())) return true
  return false
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [googleName, setGoogleName]     = useState('')
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null)

  const [accountType, setAccountType] = useState<AccountType>('organizer')
  const [displayName, setDisplayName] = useState('')
  const [churchName, setChurchName]   = useState('')
  const [state, setState]             = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      // Get Google metadata
      const meta = user.user_metadata
      setGoogleName(meta?.full_name || meta?.name || user.email?.split('@')[0] || '')
      setGoogleAvatar(meta?.avatar_url || meta?.picture || null)

      // Check if profile already complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed, account_type, display_name')
        .eq('id', user.id)
        .single()

      if (!needsCompletion(profile)) {
        router.replace('/dashboard')
        return
      }

      // Pre-fill name from Google
      const gName = meta?.full_name || meta?.name || ''
      if (gName) setDisplayName(gName)

      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) { setError('Please enter your name'); return }
    if (accountType === 'church' && !churchName.trim()) { setError('Please enter your church name'); return }
    if (!state) { setError('Please select your state'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }

    const name = accountType === 'church' ? churchName.trim() : displayName.trim()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_type:       accountType,
        display_name:       name,
        church_name:        accountType === 'church' ? churchName.trim() : null,
        state,
        profile_completed:  true,
        updated_at:         new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-5 py-12 overflow-y-auto" style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <div className="max-w-[420px] mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <span className="text-white font-black text-base">G</span>
            </div>
            <span className="text-xl font-black text-gray-900">Gospello</span>
          </Link>

          {/* Google avatar */}
          {googleAvatar && (
            <div className="flex justify-center mb-3">
              <Image
                src={googleAvatar}
                alt="Your Google photo"
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-full object-cover ring-2 ring-[#EDE9FE]"
                unoptimized
              />
            </div>
          )}
          {googleName && (
            <p className="text-[13px] text-[#9CA3AF] mb-4">
              Signed in as: <span className="font-medium text-[#6B7280]">{googleName}</span>
            </p>
          )}

          <h1 className="text-[22px] font-bold text-[#111827]">Let&apos;s set up your profile</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            This is how you&apos;ll appear on Gospello to attendees and the community
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Account type */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">I want to…</p>
            <div className="flex gap-3">
              {([
                { type: 'organizer' as AccountType, icon: '🎤', title: 'Organizer', desc: 'Post gospel events and reach believers' },
                { type: 'church'    as AccountType, icon: '⛪', title: 'Church',    desc: 'Post events and get your church discovered' },
              ]).map(({ type, icon, title, desc }) => {
                const active = accountType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className="relative flex-1 text-left p-4 rounded-2xl border-2 transition-all duration-200"
                    style={{ borderColor: active ? '#7C3AED' : '#E5E7EB', background: active ? '#FAF5FF' : '#FFFFFF' }}
                  >
                    {active && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-3xl block mb-2">{icon}</span>
                    <span className="block text-[15px] font-bold leading-tight" style={{ color: active ? '#7C3AED' : '#111827' }}>{title}</span>
                    <span className="block text-[12px] text-[#6B7280] mt-1 leading-snug">{desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Display name — always shown */}
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              Your Name on Gospello
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full h-[52px] px-4 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
                placeholder:text-gray-400 outline-none
                focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] transition-all"
            />
            <p className="text-[12px] text-[#9CA3AF] mt-1.5">
              This is the name attendees will see on your events
            </p>
          </div>

          {/* Church name — slides in */}
          <div
            className="overflow-hidden transition-all duration-200 ease-in-out"
            style={{ maxHeight: accountType === 'church' ? '110px' : '0', opacity: accountType === 'church' ? 1 : 0 }}
          >
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Church Name</label>
              <input
                type="text"
                value={churchName}
                onChange={e => setChurchName(e.target.value)}
                placeholder="e.g. House of Glory Assembly"
                className="w-full h-[52px] px-4 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
                  placeholder:text-gray-400 outline-none
                  focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] transition-all"
              />
              <p className="text-[12px] text-[#9CA3AF] mt-1.5">This will be your official church name on Gospello</p>
            </div>
          </div>

          {/* State */}
          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Your State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full h-[52px] px-4 rounded-xl border-[1.5px] border-[#E5E7EB] text-[15px]
                text-gray-700 bg-white outline-none
                focus:border-[#7C3AED] focus:ring-[3px] focus:ring-[#EDE9FE] transition-all"
            >
              <option value="">Select your state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-[12px] text-[#9CA3AF] mt-1.5">Helps attendees find local events</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-[52px] rounded-xl text-white text-[16px] font-semibold
              flex items-center justify-center gap-2
              transition-all duration-150 active:scale-[0.98] disabled:opacity-80 mt-2"
            style={{ backgroundColor: '#7C3AED' }}
            onMouseOver={e => { if (!saving) (e.currentTarget.style.backgroundColor = '#6D28D9') }}
            onMouseOut={e => { (e.currentTarget.style.backgroundColor = '#7C3AED') }}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
