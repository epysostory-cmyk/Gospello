'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useState, useEffect } from 'react'
import { Loader2, X, Plus } from 'lucide-react'
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
      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Adding…' : 'Add Category'}
    </button>
  )
}

export default function AddCategoryForm() {
  const [state, formAction] = useActionState(addCategory, null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedColor, setSelectedColor] = useState('#7C3AED')
  const [open, setOpen] = useState(false)

  // Close on success
  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      setName('')
      setSlug('')
      setSelectedColor('#7C3AED')
    }
  }, [state?.success])

  // Lock body scroll when sheet open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+$/g, ''))
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-2xl transition-colors shadow-sm shadow-indigo-200 flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>New</span>
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:duration-200">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">New Category</h2>
                <p className="text-xs text-gray-400 mt-0.5">Adds to the event tag list</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form action={formAction} className="px-5 pt-4 pb-6 space-y-4">
              <input type="hidden" name="icon" value="" />
              <input type="hidden" name="color" value={selectedColor} />

              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {state.error}
                </p>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleNameChange}
                  required
                  autoFocus
                  placeholder="e.g. Revival Meetings"
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="revival-meetings"
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1 px-1">Auto-filled · cannot be changed later</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Short description of this category"
                  maxLength={200}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Accent Color</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      title={c.label}
                      className={`w-10 h-10 rounded-full transition-all active:scale-95 ${
                        selectedColor === c.value
                          ? 'ring-3 ring-offset-2 ring-gray-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
                {/* Preview pill */}
                <div className="mt-3">
                  <span
                    className="text-sm font-semibold px-3.5 py-1.5 rounded-full"
                    style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
                  >
                    {name || 'Preview'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-2xl transition-colors active:bg-gray-300"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
