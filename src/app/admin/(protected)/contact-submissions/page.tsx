export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Mail, Inbox } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

interface Submission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

export default async function ContactSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const filter = (params.filter as string) ?? 'all'

  const adminClient = createAdminClient()

  let query = adminClient
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'unread') query = query.eq('status', 'unread') as typeof query
  if (filter === 'read')   query = query.eq('status', 'read')   as typeof query

  const { data: submissions } = await query

  // Get unread count separately
  const { count: unreadCount } = await adminClient
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread')

  const list = (submissions ?? []) as Submission[]
  const currentFilter = ['all', 'unread', 'read'].includes(filter) ? filter : 'all'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Contact Submissions</h1>
          <p className="text-gray-400 mt-1 text-sm">Messages sent through the contact form on your website</p>
        </div>
        <div className="flex items-center gap-2">
          {(unreadCount ?? 0) > 0 ? (
            <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              {unreadCount} unread
            </span>
          ) : (
            <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full">
              0 unread
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <Link
            key={f}
            href={`/admin/contact-submissions${f !== 'all' ? `?filter=${f}` : ''}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${
              currentFilter === f
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-white">No submissions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              {currentFilter === 'all'
                ? 'Submissions from your contact form will appear here.'
                : `No ${currentFilter} submissions found.`}
            </p>
          </div>
          {currentFilter !== 'all' && (
            <Link href="/admin/contact-submissions" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              View all submissions →
            </Link>
          )}
        </div>
      ) : (
        /* Submissions list */
        <div className="space-y-3">
          {list.map((sub) => (
            <div
              key={sub.id}
              className={`rounded-2xl border p-5 transition-colors ${
                sub.status === 'unread'
                  ? 'border-indigo-500/20 bg-indigo-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {/* Top row: avatar + name + date */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-300 font-black text-sm">
                    {sub.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{sub.name}</p>
                      {sub.status === 'unread' && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{sub.email}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(sub.created_at).toLocaleTimeString('en-NG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Subject + message */}
              <div className="mt-3 ml-[52px]">
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/5 text-gray-400 px-2.5 py-1 rounded-full border border-white/10 mb-2 capitalize">
                  {sub.subject.replace(/_/g, ' ')}
                </span>
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{sub.message}</p>
              </div>

              {/* Reply */}
              <div className="mt-4 flex items-center justify-end">
                <a
                  href={`mailto:${sub.email}?subject=Re: ${encodeURIComponent(sub.subject)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Reply via Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
