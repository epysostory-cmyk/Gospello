'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import type { AdminRole } from '@/types/database'

interface Props {
  adminId: string
  currentRole: AdminRole
}

export default function AdminTeamActions({ adminId, currentRole }: Props) {
  const router = useRouter()
  const [role, setRole] = useState<AdminRole>(currentRole)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const updateRole = async (newRole: AdminRole) => {
    setLoading(true)
    setRole(newRole)
    await fetch('/api/admin/update-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, role: newRole }),
    })
    setLoading(false)
    router.refresh()
  }

  const removeAdmin = async () => {
    if (!confirm('Remove this admin? They will lose all admin access.')) return
    setRemoving(true)
    await fetch('/api/admin/remove-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    })
    setRemoving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => updateRole(e.target.value as AdminRole)}
        disabled={loading}
        className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <button
        onClick={removeAdmin}
        disabled={removing}
        className="text-red-500 hover:text-red-700"
        title="Remove admin"
      >
        {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
