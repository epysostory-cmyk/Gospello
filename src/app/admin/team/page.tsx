export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { AdminUser } from '@/types/database'
import { formatDate } from '@/lib/utils'
import AdminTeamActions from './AdminTeamActions'
import AddAdminForm from './AddAdminForm'

export default async function AdminTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Only super_admin can manage team
  const adminClient = createAdminClient()
  const { data: currentAdmin } = await adminClient
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentAdmin || currentAdmin.role !== 'super_admin') redirect('/admin')

  const { data: admins } = await adminClient
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false })

  const roleColor = (role: string) => ({
    super_admin: 'bg-purple-50 text-purple-700',
    admin: 'bg-blue-50 text-blue-700',
    moderator: 'bg-green-50 text-green-700',
  }[role] ?? 'bg-gray-50 text-gray-700')

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Team</h1>
        <p className="text-gray-500 mt-1">Manage admin users and their roles</p>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { role: 'Super Admin', color: 'border-purple-200 bg-purple-50', desc: 'Full access — manage admins, approve events, all settings' },
          { role: 'Admin', color: 'border-blue-200 bg-blue-50', desc: 'Approve/reject events, manage users, feature content' },
          { role: 'Moderator', color: 'border-green-200 bg-green-50', desc: 'Review and flag events only' },
        ].map(({ role, color, desc }) => (
          <div key={role} className={`rounded-2xl border p-4 ${color}`}>
            <p className="font-semibold text-gray-900 text-sm">{role}</p>
            <p className="text-xs text-gray-600 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Add new admin */}
      <AddAdminForm />

      {/* Current admins */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Current Admin Users ({admins?.length ?? 0})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(admins as AdminUser[])?.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-gray-900">{admin.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Added {formatDate(admin.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColor(admin.role)}`}>
                  {admin.role.replace('_', ' ')}
                </span>
                {admin.id !== user.id && (
                  <AdminTeamActions adminId={admin.id} currentRole={admin.role} />
                )}
                {admin.id === user.id && (
                  <span className="text-xs text-gray-400">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
