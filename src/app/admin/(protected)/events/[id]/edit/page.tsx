import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getVisibleCategories } from '@/app/actions/categories'
import AdminEditEventForm from './AdminEditEventForm'

export const dynamic = 'force-dynamic'

export default async function AdminEditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createAdminClient()

  const { data: event } = await adminClient
    .from('events')
    .select('*, churches(id, name, city, state), profiles(id, display_name, city, state), seeded_organizers(id, name, city, state)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const categories = await getVisibleCategories()

  return (
    <div className="p-6">
      <AdminEditEventForm
        adminId={user.id}
        event={event}
        categories={categories}
      />
    </div>
  )
}
