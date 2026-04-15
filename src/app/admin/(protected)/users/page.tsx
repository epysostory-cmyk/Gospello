export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Users, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface SearchParams {
  search?: string
  type?: string
  page?: string
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const resolvedParams = await searchParams
  const search = resolvedParams.search || ''
  const type = resolvedParams.type || ''
  const page = parseInt(resolvedParams.page || '1')
  const pageSize = 25

  let query = adminClient
    .from('profiles')
    .select('id, email, display_name, account_type, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (type) {
    query = query.eq('account_type', type)
  }

  const { data: users, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)

  // Counts per type for badges
  const { data: typeCounts } = await adminClient
    .from('profiles')
    .select('account_type')

  const counts = {
    all: typeCounts?.length ?? 0,
    organizer: typeCounts?.filter(u => u.account_type === 'organizer').length ?? 0,
    church: typeCounts?.filter(u => u.account_type === 'church').length ?? 0,
  }

  const totalPages = Math.ceil((total ?? 0) / pageSize)

  const typeFilters = [
    { value: '', label: 'All', icon: Users, count: counts.all },
    { value: 'organizer', label: 'Organizers', icon: User, count: counts.organizer },
    { value: 'church', label: 'Churches', icon: Building2, count: counts.church },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1 text-sm">{counts.all} registered accounts</p>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map(({ value, label, icon: Icon, count }) => (
          <Link
            key={value}
            href={`/admin/users${value ? `?type=${value}` : ''}${search && value ? `&search=${search}` : search ? `?search=${search}` : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === value ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${type === value ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-500'}`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex gap-2">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            name="search"
            placeholder="Search by name or email..."
            defaultValue={search}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          Search
        </button>
        {search && (
          <Link href={`/admin/users${type ? `?type=${type}` : ''}`} className="px-4 py-2 rounded-xl bg-white/10 text-gray-400 text-sm font-medium hover:bg-white/20">
            Clear
          </Link>
        )}
      </form>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!users || users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      {search ? `No users matching "${search}"` : 'No users registered yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${user.account_type === 'church' ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
                          {user.account_type === 'church'
                            ? <Building2 className="w-4 h-4 text-amber-400" />
                            : <User className="w-4 h-4 text-indigo-400" />
                          }
                        </div>
                        <p className="text-sm font-medium text-white">{user.display_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-300">{user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        user.account_type === 'church'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {user.account_type === 'church' ? '⛪' : '🎤'} {user.account_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-400">{formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total ?? 0)} of {total} users
            </p>
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
