export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, ShieldCheck, Lock, Clock, LogIn, UserPlus } from 'lucide-react'
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
  let isClaimed = false
  let hasPendingClaim = false

  if (profileType === 'church') {
    const { data } = await adminClient.from('churches').select('name, city, state, is_claimed, claim_requested_at').eq('id', id).single()
    if (!data) notFound()
    profileName = data.name
    profileCity = [data.city, data.state].filter(Boolean).join(', ')
    isClaimed = data.is_claimed
    hasPendingClaim = !!data.claim_requested_at
  } else {
    const { data } = await adminClient.from('seeded_organizers').select('name, city, state, is_claimed, claim_requested_at').eq('id', id).single()
    if (!data) notFound()
    profileName = data.name
    profileCity = [data.city, data.state].filter(Boolean).join(', ')
    isClaimed = data.is_claimed
    hasPendingClaim = !!data.claim_requested_at
  }

  const backHref    = profileType === 'church' ? `/churches` : `/organizers`
  const redirectUrl = `/claim/${profileType}/${id}`

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">

      {/* Top bar */}
      <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {profileType === 'church' ? 'Churches' : 'Organizers'}
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-8 pb-6 sm:px-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Claim this Profile</h1>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {profileName}{profileCity ? ` · ${profileCity}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-7 sm:px-8">

            {/* ── Already claimed ── */}
            {isClaimed ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Already Claimed</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  This profile has already been claimed and verified by its owner.
                </p>
                <Link
                  href={backHref}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back
                </Link>
              </div>

            ) : hasPendingClaim ? (
              /* ── Pending claim ── */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Claim Under Review</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  A claim request for this profile is already pending admin review.
                </p>
                <Link
                  href={backHref}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go back
                </Link>
              </div>

            ) : !user ? (
              /* ── Not signed in ── */
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-7 h-7 text-[#7C3AED]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Sign in to Continue</h2>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                  You need a Gospello account to claim <strong className="text-gray-700">{profileName}</strong>. Sign in or create a free account to proceed.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create account
                  </Link>
                </div>

                <p className="text-xs text-gray-400 mt-5">Free to join · No credit card required</p>
              </div>

            ) : (
              /* ── Signed in — show claim form ── */
              <>
                <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 mb-6 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#7C3AED] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Fill in the form below. Our team will review your claim and verify your affiliation within <strong>2–3 business days</strong>.
                  </p>
                </div>
                <ClaimForm profileId={id} profileType={profileType} profileName={profileName} />
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
