'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { migrateSavedEvents } from '@/app/actions/saved-events'

const LS_KEY = 'gospello_saved_events'

/** Renders nothing. On mount, migrates localStorage saved events to the DB for logged-in users. */
export default function SavedEventsMigrator() {
  useEffect(() => {
    async function migrate() {
      try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return

        let ids: string[]
        try {
          ids = JSON.parse(raw) as string[]
        } catch {
          return
        }
        if (!Array.isArray(ids) || ids.length === 0) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const result = await migrateSavedEvents(ids)
        if (result.success) {
          localStorage.removeItem(LS_KEY)
        }
      } catch {
        // Silently fail — migration is best-effort
      }
    }

    migrate()
  }, [])

  return null
}
