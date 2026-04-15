'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteCategory } from './actions'

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-60"
      title="Delete category"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function DeleteCategoryButton({ id }: { id: string }) {
  const deleteWithId = deleteCategory.bind(null, id)

  async function handleSubmit() {
    if (!window.confirm('Delete this category? This cannot be undone.')) return
    await deleteWithId()
  }

  return (
    <form action={handleSubmit}>
      <DeleteButton />
    </form>
  )
}
