import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Profile Settings' }

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import type { AccountType } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ProfileForm
      userId={user.id}
      initialData={{
        display_name: profile?.display_name ?? '',
        email: profile?.email ?? user.email ?? '',
        account_type: (profile?.account_type ?? 'organizer') as AccountType,
        church_name: (profile as any)?.church_name ?? '',
        bio: (profile as any)?.bio ?? '',
        state: (profile as any)?.state ?? '',
        website: (profile as any)?.website ?? '',
        avatar_url: profile?.avatar_url ?? null,
        ministry_type: (profile as any)?.ministry_type ?? null,
      }}
    />
  )
}
