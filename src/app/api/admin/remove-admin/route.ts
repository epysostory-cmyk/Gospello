import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: requester } = await adminClient
    .from('admin_users').select('role').eq('id', user.id).single()
  if (!requester || requester.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can remove admins' }, { status: 403 })
  }

  const { adminId } = await request.json()
  if (adminId === user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('admin_users').delete().eq('id', adminId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
