import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import EditProfileForm from './EditProfileForm'

export const dynamic = 'force-dynamic'

export default async function AdminEditProfilePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type, id } = await params

  if (type !== 'church' && type !== 'organizer') notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()

  if (type === 'church') {
    const { data: church } = await adminClient
      .from('churches')
      .select('*')
      .eq('id', id)
      .single()

    if (!church) notFound()

    return (
      <div className="p-6">
        <EditProfileForm type="church" profile={church} />
      </div>
    )
  } else {
    const { data: organizer } = await adminClient
      .from('seeded_organizers')
      .select('*')
      .eq('id', id)
      .single()

    if (!organizer) notFound()

    return (
      <div className="p-6">
        <EditProfileForm type="organizer" profile={organizer} />
      </div>
    )
  }
}
