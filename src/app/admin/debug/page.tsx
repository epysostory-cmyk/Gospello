'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()

      const allCookies = document.cookie
      const cookieNames = allCookies
        ? allCookies.split(';').map(c => c.trim().split('=')[0])
        : []

      setInfo({
        browser_cookie_string_length: allCookies.length,
        browser_cookie_names: cookieNames,
        supabase_session_exists: !!session,
        supabase_user_email: user?.email ?? null,
        supabase_access_token_first20: session?.access_token?.substring(0, 20) ?? null,
      })
    }
    run()
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: 20 }}>Client-Side Debug</h1>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(info, null, 2)}
      </pre>
      <div style={{ marginTop: 30 }}>
        <p style={{ color: 'gray', fontSize: 12 }}>
          This page shows what YOUR BROWSER has — cookies and session.
          If supabase_session_exists is false, the browser client has no session.
        </p>
      </div>
    </div>
  )
}
