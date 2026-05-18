'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { addCategory } from './actions'

const COLOR_OPTIONS = [
  { value: '#7C3AED', label: 'Purple' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#059669', label: 'Green' },
  { value: '#D97706', label: 'Amber' },
  { value: '#DC2626', label: 'Red' },
  { value: '#0891B2', label: 'Cyan' },
  { value: '#EA580C', label: 'Orange' },
  { value: '#6B7280', label: 'Gray' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Adding...' : 'Add Category'}
    </button>
  )
}

export default function AddCategoryForm() {
  const [state, formAction] = useActionState(addCategory, null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedColor, setSelectedColor] = useState('#7C3AED')
  const [open, setOpen] = useState(false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+$/g, ''))
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        + New Category
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">New Category</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form action={formAction} className="p-6 space-y-5">
        <input type="hidden" name="icon" value="" />
        <input type="hidden" name="color" value={selectedColor} />

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
            Category added successfully.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleNameChange}
              required
              autoFocus
              placeholder="e.g. Revival Meetings"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. revival-meetings"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-filled from name. Cannot be changed later.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="Short description of this category"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
          <div className="flex items-center gap-3 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                title={c.label}
                className={`w-8 h-8 rounded-full transition-all ${
                  selectedColor === c.value
                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {COLOR_OPTIONS.find(c => c.value === selectedColor)?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: selectedColor + '18',
              color: selectedColor,
            }}
          >
            {name || 'Preview'}
          </div>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
