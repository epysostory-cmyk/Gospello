import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Verify requester is super_admin
  const { data: requester } = await adminClient
    .from('admin_users').select('role').eq('id', user.id).single()
  if (!requester || requester.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can add admins' }, { status: 403 })
  }

  const { email, role } = await request.json()
  if (!email || !role) return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })

  // Find the user by email in auth.users
  const { data: users } = await adminClient.auth.admin.listUsers()
  const targetUser = users.users.find((u) => u.email === email)

  if (!targetUser) {
    return NextResponse.json({ error: 'No Gospello account found with that email. They must sign up first.' }, { status: 404 })
  }

  // Check if already admin
  const { data: existing } = await adminClient
    .from('admin_users').select('id').eq('id', targetUser.id).single()
  if (existing) {
    return NextResponse.json({ error: 'This user is already an admin' }, { status: 409 })
  }

  const { error } = await adminClient
    .from('admin_users')
    .insert({ id: targetUser.id, email: targetUser.email!, role })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
