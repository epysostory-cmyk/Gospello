export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import ClaimForm from './ClaimForm'

type ProfileTypeParam = 'church' | 'organizer'

export default async function ClaimPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params

  if (type !== 'church' && type !== 'organizer') notFound()
  const profileType = type as ProfileTypeParam

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // Fetch profile
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

  const backHref = profileType === 'church' ? `/churches` : `/organizers`

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.08)] p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Claim this Profile</h1>
              <p className="text-sm text-gray-500">{profileName}{profileCity ? ` · ${profileCity}` : ''}</p>
            </div>
          </div>

          {/* Already claimed */}
          {isClaimed ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔒</div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Already Claimed</h2>
              <p className="text-sm text-gray-500">This profile has already been claimed by its owner.</p>
            </div>
          ) : hasPendingClaim ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Claim Under Review</h2>
              <p className="text-sm text-gray-500">A claim request for this profile is already pending review.</p>
            </div>
          ) : !user ? (
            /* Not signed in — prompt login */
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-5">
                You need to be signed in to claim this profile. Don't have an account? Sign up — it's free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/login?redirect=/claim/${profileType}/${id}`}
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?redirect=/claim/${profileType}/${id}`}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-5">
                Fill in the form below. Our team will review your claim and verify your affiliation within 2–3 business days.
              </p>
              <ClaimForm profileId={id} profileType={profileType} profileName={profileName} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
