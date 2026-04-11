'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import type { AdminRole } from '@/types/database'

export default function AddAdminForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AdminRole>('moderator')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/add-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to add admin')
    } else {
      setSuccess(`${email} added as ${role.replace('_', ' ')} successfully!`)
      setEmail('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Add New Admin</h2>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
        {error && <p className="w-full text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        {success && <p className="w-full text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}

        <div className="flex-1 min-w-52">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">User must already have a Gospello account</p>
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Add Admin
        </button>
      </form>
    </div>
  )
}
