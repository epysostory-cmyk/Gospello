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

  function buildUrl(overrides: Partial<SearchParams>) {
    const p: Record<string, string> = {}
    const t = overrides.type !== undefined ? overrides.type : type
    const s = overrides.search !== undefined ? overrides.search : search
    const pg = overrides.page !== undefined ? overrides.page : String(page)
    if (t)  p.type   = t
    if (s)  p.search = s
    if (pg && pg !== '1') p.page = pg
    const qs = new URLSearchParams(p).toString()
    return `/admin/users${qs ? '?' + qs : ''}`
  }

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">{counts.all} registered accounts</p>
      </div>

      {/* Stat chips */}
      <div className="flex gap-2 flex-wrap">
        {([
          { value: '',          label: 'All',        icon: Users,     count: counts.all },
          { value: 'organizer', label: 'Organizers', icon: User,      count: counts.organizer },
          { value: 'church',    label: 'Churches',   icon: Building2, count: counts.church },
        ] as const).map(({ value, label, icon: Icon, count }) => (
          <Link key={value}
            href={buildUrl({ type: value, page: '1' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              type === value ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              type === value ? 'bg-white/20 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>{count}</span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="flex gap-2">
        {type && <input type="hidden" name="type" value={type} />}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" name="search" placeholder="Search name or email…" defaultValue={search}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
          Search
        </button>
        {search && (
          <Link href={buildUrl({ search: '', page: '1' })}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* User cards */}
      {userList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{search ? `No users matching "${search}"` : 'No users yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userList.map((user) => {
            const suspended = user.status === 'suspended'
            const hidden    = user.is_hidden ?? false
            const name      = user.display_name || user.email
            const initial   = (user.display_name || user.email || '?')[0].toUpperCase()
            return (
              <div key={user.id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 ${hidden ? 'opacity-60' : ''}`}>

                {/* Top row: avatar + name + badges */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    user.account_type === 'church' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.display_name || '—'}</p>
                      {hidden && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      user.account_type === 'church' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {user.account_type === 'church' ? '⛪' : '🎤'} {user.account_type}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      suspended ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {suspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Meta row */}
                <p className="text-[11px] text-gray-400 mt-2 pl-[52px]">
                  Joined {formatDate(user.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                  <ChangeTypeButton userId={user.id} currentType={user.account_type} />
                  <UserActions userId={user.id} status={user.status ?? 'active'} isHidden={hidden} displayName={name} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            {(page-1)*pageSize+1}–{Math.min(page*pageSize, total??0)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
