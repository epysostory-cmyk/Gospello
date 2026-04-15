export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Shield } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import AddAdminFormNew from './AddAdminFormNew'
import DeleteAdminButton from './DeleteAdminButton'

export default async function AdminTeamPage() {
  const adminClient = createAdminClient()

  const { data: adminUsers } = await adminClient
    .from('admin_users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  const roleLabels = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    moderator: 'Moderator',
  }

  const roleColors = {
    super_admin: 'bg-red-500/10 text-red-400 border-red-500/30',
    admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    moderator: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Management</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage administrative team members</p>
      </div>

      {/* Add Admin Form */}
      <AddAdminFormNew />

      {/* Admin Team Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!adminUsers || adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center">
                    <p className="text-gray-400 text-sm">No admin users</p>
                  </td>
                </tr>
              ) : (
                adminUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role as keyof typeof roleColors] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                        {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-400">{formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <DeleteAdminButton userId={user.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
