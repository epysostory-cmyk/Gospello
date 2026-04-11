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
    return NextResponse.json({ error: 'Only super admins can update roles' }, { status: 403 })
  }

  const { adminId, role } = await request.json()
  const { error } = await adminClient
    .from('admin_users').update({ role }).eq('id', adminId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
