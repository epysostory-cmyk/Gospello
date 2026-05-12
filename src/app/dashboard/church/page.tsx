export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Church } from '@/types/database'
import ChurchProfileForm from './ChurchProfileForm'
import BackButton from '@/components/ui/BackButton'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default async function ChurchProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('churches')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!data) redirect('/dashboard/church/setup')

  const church = data as Church

  return (
    <div className="space-y-8 max-w-2xl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Church Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your church&apos;s public listing on Gospello</p>
        </div>
        <Link
          href={`/churches/${church.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View public page
        </Link>
      </div>

      <ChurchProfileForm church={church} userId={user.id} />
    </div>
  )
}
