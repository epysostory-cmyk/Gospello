'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { addAdminUser } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      Add Admin
    </button>
  )
}

export default function AddAdminFormNew() {
  const [state, formAction] = useActionState(addAdminUser, null)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Add New Admin</h2>
      <form action={formAction} className="flex flex-wrap gap-3 items-start">
        {state?.error && (
          <p className="w-full text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="w-full text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
            Admin added successfully.
          </p>
        )}

        <div className="flex-1 min-w-52">
          <input
            type="email"
            name="email"
            required
            placeholder="admin@example.com"
            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">User must already have a Gospello account</p>
        </div>

        <select
          name="role"
          defaultValue="moderator"
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
        >
          <option value="moderator" className="bg-[#0D0D14]">Moderator</option>
          <option value="admin" className="bg-[#0D0D14]">Admin</option>
          <option value="super_admin" className="bg-[#0D0D14]">Super Admin</option>
        </select>

        <SubmitButton />
      </form>
    </div>
  )
}
