export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import AddAdminFormNew from './AddAdminFormNew'
import DeleteAdminButton from './DeleteAdminButton'

export default async function AdminTeamPage() {
  const adminClient = createAdminClient()

  const { data: adminUsers } = await adminClient
    .from('admin_users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin', admin: 'Admin', moderator: 'Moderator',
  }
  const ROLE_CLS: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700 border-red-200',
    admin:       'bg-violet-100 text-violet-700 border-violet-200',
    moderator:   'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Roles &amp; Admins</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Manage administrative team members and permissions</p>
      </div>

      {/* Role permissions card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Permission Matrix</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { role: 'Super Admin', cls: 'border-red-200 bg-red-50', perms: ['Everything below', 'Assign/remove roles', 'Platform settings', 'Billing & usage'] },
            { role: 'Admin',       cls: 'border-violet-200 bg-violet-50', perms: ['Create unclaimed profiles', 'Create events under any profile', 'Approve/reject claims', 'Suspend & hide accounts', 'Feature/unfeature events', 'Manage categories'] },
            { role: 'Moderator',   cls: 'border-amber-200 bg-amber-50', perms: ['Create unclaimed profiles', 'Create events under any profile', 'View event queue'] },
          ].map(({ role, cls, perms }) => (
            <div key={role} className={`rounded-xl border p-4 ${cls}`}>
              <p className="text-sm font-bold text-gray-900 mb-2">{role}</p>
              <ul className="space-y-1">
                {perms.map(p => <li key={p} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-500 flex-shrink-0">✓</span>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <AddAdminFormNew />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Admin Team</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Email','Role','Joined','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!adminUsers || adminUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No admin users</td></tr>
              ) : (adminUsers as any[]).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5"><p className="text-sm font-medium text-gray-900">{user.email}</p></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_CLS[user.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p></td>
                  <td className="px-5 py-3.5"><DeleteAdminButton userId={user.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
