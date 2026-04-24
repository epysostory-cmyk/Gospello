export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Search, Users, Building2, User, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import ChangeTypeButton from './ChangeTypeButton'
import UserActions from './UserActions'

interface SearchParams { search?: string; type?: string; page?: string }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const adminClient = createAdminClient()
  const resolved = await searchParams
  const search   = resolved.search || ''
  const type     = resolved.type   || ''
  const page     = parseInt(resolved.page || '1')
  const pageSize = 25

  let query = adminClient
    .from('profiles')
    .select('id, email, display_name, account_type, created_at, status, is_hidden', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`)
  if (type)   query = query.eq('account_type', type as 'church' | 'organizer')

  const { data: users, count: total } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const { data: typeCounts } = await adminClient.from('profiles').select('account_type')

  const counts = {
    all:       typeCounts?.length ?? 0,
    organizer: typeCounts?.filter(u => u.account_type === 'organizer').length ?? 0,
    church:    typeCounts?.filter(u => u.account_type === 'church').length ?? 0,
  }
  const totalPages = Math.ceil((total ?? 0) / pageSize)

  type UserRow = { id:string; email:string; display_name:string|null; account_type:string; created_at:string; status:string|null; is_hidden:boolean|null }
  const userList = (users ?? []) as UserRow[]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{counts.all} registered accounts</p>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {([
          { value: '',          label: 'All',        icon: Users,     count: counts.all },
          { value: 'organizer', label: 'Organizers',  icon: User,      count: counts.organizer },
          { value: 'church',    label: 'Churches',    icon: Building2, count: counts.church },
        ] as const).map(({ value, label, icon: Icon, count }) => (
          <Link key={value}
            href={`/admin/users${value ? `?type=${value}` : ''}${search && value ? `&search=${search}` : search ? `?search=${search}` : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              type === value ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${type === value ? 'bg-white/20 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>{count}</span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex gap-2">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" name="search" placeholder="Search by name or email..." defaultValue={search}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9]">Search</button>
        {search && (
          <Link href={`/admin/users${type ? `?type=${type}` : ''}`}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Name','Email','Type','Status','Joined','Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {userList.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  {search ? `No users matching "${search}"` : 'No users yet'}
                </td></tr>
              ) : userList.map((user) => {
                const suspended = user.status === 'suspended'
                const hidden    = user.is_hidden ?? false
                const name      = user.display_name || user.email
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${hidden ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${user.account_type === 'church' ? 'bg-amber-100' : 'bg-violet-100'}`}>
                          {user.account_type === 'church' ? <Building2 className="w-4 h-4 text-amber-600" /> : <User className="w-4 h-4 text-violet-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.display_name || '—'}</p>
                          {hidden && <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><EyeOff className="w-2.5 h-2.5" />Hidden</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{user.email}</p></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        user.account_type === 'church' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {user.account_type === 'church' ? '⛪' : '🎤'} {user.account_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                        suspended ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><p className="text-sm text-gray-500">{formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChangeTypeButton userId={user.id} currentType={user.account_type} />
                        <UserActions userId={user.id} status={user.status ?? 'active'} isHidden={hidden} displayName={name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize,total??0)} of {total}</p>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/admin/users?page=${page-1}${type?`&type=${type}`:''}${search?`&search=${search}`:''}`} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Previous</Link>}
              {page < totalPages && <Link href={`/admin/users?page=${page+1}${type?`&type=${type}`:''}${search?`&search=${search}`:''}`} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50">Next</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
