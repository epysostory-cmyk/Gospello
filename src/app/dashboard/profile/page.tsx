import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Profile Settings' }

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from './ProfileForm'
import type { AccountType } from '@/types/database'
import BackButton from '@/components/ui/BackButton'

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
    <>
      <BackButton />
      <ProfileForm
      userId={user.id}
      initialData={{
        display_name:   profile?.display_name ?? '',
        email:          profile?.email ?? user.email ?? '',
        account_type:   (profile?.account_type ?? 'organizer') as AccountType,
        church_name:    (profile as any)?.church_name ?? '',
        bio:            (profile as any)?.bio ?? '',
        state:          (profile as any)?.state ?? '',
        city:           (profile as any)?.city ?? '',
        address:        (profile as any)?.address ?? '',
        phone:          (profile as any)?.phone ?? '',
        whatsapp:       (profile as any)?.whatsapp ?? '',
        website:        (profile as any)?.website ?? '',
        instagram:      (profile as any)?.instagram ?? '',
        facebook:       (profile as any)?.facebook ?? '',
        twitter:        (profile as any)?.twitter ?? '',
        youtube:        (profile as any)?.youtube ?? '',
        contact_person: (profile as any)?.contact_person ?? '',
        ministry_types: (profile as any)?.ministry_types ?? [],
        avatar_url:     profile?.avatar_url ?? null,
      }}
    />
    </>
  )
}
