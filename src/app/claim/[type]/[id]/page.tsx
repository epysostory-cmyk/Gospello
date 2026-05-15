export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, ShieldCheck, Lock, Clock, LogIn, UserPlus, CheckCircle, Pencil, Calendar, Star } from 'lucide-react'
import ClaimForm from './ClaimForm'

type ProfileTypeParam = 'church' | 'organizer'

export default async function ClaimPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params

  if (type !== 'church' && type !== 'organizer') notFound()
  const profileType = type as ProfileTypeParam

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  let profileName = ''
  let profileCity = ''
  let isClaimed   = false
  let hasPendingClaim = false

  if (profileType === 'church') {
    const { data } = await adminClient.from('churches').select('name, city, state, is_claimed, claim_requested_at').eq('id', id).single()
    if (!data) notFound()
    profileName     = data.name
    profileCity     = [data.city, data.state].filter(Boolean).join(', ')
    isClaimed       = data.is_claimed
    hasPendingClaim = !!data.claim_requested_at
  } else {
    const { data } = await adminClient.from('seeded_organizers').select('name, city, state, is_claimed, claim_requested_at').eq('id', id).single()
    if (!data) notFound()
    profileName     = data.name
    profileCity     = [data.city, data.state].filter(Boolean).join(', ')
    isClaimed       = data.is_claimed
    hasPendingClaim = !!data.claim_requested_at
  }

  const backHref    = profileType === 'church' ? `/churches` : `/organizers`
  const redirectUrl = `/claim/${profileType}/${id}`
  const typeName    = profileType === 'church' ? 'church' : 'organisation'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="max-w-xl mx-auto w-full px-4 pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 pb-16">

        {/* ── Already claimed ── */}
        {isClaimed ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Already Claimed</h1>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              This profile has already been claimed and is managed by its owner.
            </p>
            <Link href={backHref}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Go back
            </Link>
          </div>

        ) : hasPendingClaim ? (
        /* ── Pending claim ── */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Claim Under Review</h1>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              Someone has already submitted a claim for this profile. Our team is reviewing it.
            </p>
            <Link href={backHref}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Go back
            </Link>
          </div>

        ) : (
          <>
            {/* Profile badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Claiming profile for</p>
                <p className="text-sm font-bold text-gray-900 truncate">{profileName}{profileCity ? ` · ${profileCity}` : ''}</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">
                Is this your {typeName}?
              </h1>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Claim it to take control — edit your profile, post events, and connect with your community on Gospello.
              </p>
            </div>

            {/* What you get */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Pencil,   label: 'Edit your profile' },
                { icon: Calendar, label: 'Post events' },
                { icon: Star,     label: 'Get verified' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
                  <Icon className="w-4 h-4 text-[#7C3AED] mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-gray-700 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">How it works</p>
              <div className="space-y-3.5">
                {[
                  { step: '1', title: 'Fill in the form below', desc: 'Tell us who you are and your role at this ' + typeName },
                  { step: '2', title: 'We verify within 2–3 days', desc: 'Our team reviews your request and confirms your affiliation' },
                  { step: '3', title: 'You get full access', desc: 'Edit the profile, post events and manage everything' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-[#7C3AED]">{step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Not signed in */}
            {!user ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Sign in to continue</p>
                    <p className="text-xs text-gray-500 mt-0.5">You need a Gospello account to claim this profile</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in to my account
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create a free account
                  </Link>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">Free to join</p>
              </div>

            ) : (
              /* Signed in — show form */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Signed in as <span className="font-semibold text-gray-900">{user.email}</span></p>
                </div>
                <ClaimForm profileId={id} profileType={profileType} profileName={profileName} userEmail={user.email ?? undefined} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
