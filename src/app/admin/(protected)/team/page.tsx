export const dynamic = 'force-dynamic'

import { requireAdminRole } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'
import { ShieldCheck, Shield, Eye } from 'lucide-react'
import AddAdminFormNew from './AddAdminFormNew'
import DeleteAdminButton from './DeleteAdminButton'

export default async function AdminTeamPage() {
  await requireAdminRole(['super_admin'])
  const adminClient = createAdminClient()

  const { data: adminUsers } = await adminClient
    .from('admin_users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  const ROLE_META: Record<string, { label: string; cls: string; icon: typeof ShieldCheck; desc: string }> = {
    super_admin: {
      label: 'Super Admin',
      cls:   'bg-red-100 text-red-700 border-red-200',
      icon:  ShieldCheck,
      desc:  'Full access — roles, settings, billing',
    },
    admin: {
      label: 'Admin',
      cls:   'bg-violet-100 text-violet-700 border-violet-200',
      icon:  Shield,
      desc:  'Manage profiles, events, claims, users',
    },
    moderator: {
      label: 'Moderator',
      cls:   'bg-amber-100 text-amber-700 border-amber-200',
      icon:  Eye,
      desc:  'Create profiles & events, view queue',
    },
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin accounts and their permissions</p>
      </div>

      {/* Role reference — compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(ROLE_META).map(([key, meta]) => {
          const Icon = meta.icon
          return (
            <div key={key} className={`rounded-2xl border p-4 ${meta.cls.replace('text-', 'border-').replace('bg-', 'bg-')}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <p className="text-sm font-bold">{meta.label}</p>
              </div>
              <p className="text-xs opacity-80 leading-snug">{meta.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Add admin form */}
      <AddAdminFormNew />

      {/* Team list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
          {adminUsers?.length ?? 0} admin{adminUsers?.length !== 1 ? 's' : ''}
        </p>

        {!adminUsers || adminUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-400">No admin users yet</p>
          </div>
        ) : (adminUsers as any[]).map((user) => {
          const meta = ROLE_META[user.role]
          const Icon = meta?.icon ?? Shield
          const initial = user.email[0].toUpperCase()
          return (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold border ${meta?.cls ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {initial}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Added {formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Role badge */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta?.cls ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  <Icon className="w-3 h-3" />
                  {meta?.label ?? user.role}
                </span>
              </div>

              {/* Delete — separated so it's intentional */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                <DeleteAdminButton userId={user.id} />
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
