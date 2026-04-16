'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full disabled:opacity-60"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <LogOut className="w-4 h-4" />
      }
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
