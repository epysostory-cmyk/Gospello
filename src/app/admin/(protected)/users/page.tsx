export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Shield, User } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams {
  search?: string
  type?: string
  page?: string
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const adminClient = createAdminClient()
  const search = searchParams.search || ''
  const type = searchParams.type || ''
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20

  let query = adminClient
    .from('profiles')
    .select('id, display_name, account_type, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('display_name', `%${search}%`)
  }
  if (type) {
    query = query.eq('account_type', type)
  }

  const { data: users, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  const totalPages = Math.ceil((total ?? 0) / pageSize)

  const typeOptions = [
    { value: 'individual', label: 'Individual', icon: '🎤' },
    { value: 'church', label: 'Church', icon: '⛪' },
    { value: 'organizer', label: 'Organizer', icon: '🎯' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage all registered users and organizations</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name..."
            defaultValue={search}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/users" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!type ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
            All
          </Link>
          {typeOptions.map(({ value, label }) => (
            <Link
              key={value}
              href={`/admin/users?type=${value}${search ? `&search=${search}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === value ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!users || users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center">
                    <p className="text-gray-400 text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const typeInfo = typeOptions.find(t => t.value === user.account_type)

                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-white">{user.display_name}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-400">{typeInfo?.label || user.account_type}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-400">{formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/users?page=${page - 1}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/users?page=${page + 1}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-gray-400 transition-colors">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
