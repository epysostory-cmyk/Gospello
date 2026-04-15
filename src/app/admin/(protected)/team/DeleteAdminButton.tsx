'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteAdminUser } from './actions'

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-60"
      title="Remove admin"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}

export default function DeleteAdminButton({ userId }: { userId: string }) {
  const deleteWithId = deleteAdminUser.bind(null, userId)

  async function handleSubmit(formData: FormData) {
    if (!window.confirm('Remove this admin? They will lose all admin access.')) return
    await deleteWithId()
  }

  return (
    <form action={handleSubmit}>
      <DeleteButton />
    </form>
  )
}
