'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { addCategory } from './actions'

const ICON_OPTIONS = [
  // Worship & Prayer
  '🙏','🔥','✨','🕊️','🙌','👐','🫶','🌊',
  // Events & Music
  '🎵','🎤','🎶','🎸','🥁','🎺','🎻','🎹',
  // Church & Ministry
  '⛪','🏛️','📖','📜','✝️','💒','🛐','📿',
  // People & Community
  '👥','🌟','💫','🌍','🤝','🧑‍🤝‍🧑','🫂','🌺',
  // Media & Tech
  '🎙️','📻','📺','💻','📱','🎧','📡','🔊',
  // Misc
  '🌈','💡','🏆','🎯','🎗️','🕯️','⭐','🔑',
]

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
      {pending ? 'Saving...' : 'Add Category'}
    </button>
  )
}

export default function AddCategoryForm() {
  const [state, formAction] = useActionState(addCategory, null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6B7280')
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
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        + Add Category
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white">Add New Category</h2>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          Cancel
        </button>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Hidden fields for selected icon/color */}
        <input type="hidden" name="icon" value={selectedIcon} />
        <input type="hidden" name="color" value={selectedColor} />

        {state?.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
            Category added!
          </p>
        )}

        {/* Name + Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="e.g. Revival Meetings"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Slug *</label>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. revival"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-600 mt-1">Cannot be changed after creation</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Description <span className="text-gray-600">(optional)</span></label>
          <textarea
            name="description"
            rows={2}
            placeholder="Short description of this category"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Icon *
            {selectedIcon && (
              <span className="ml-2 text-white text-base">{selectedIcon} selected</span>
            )}
          </label>
          <div className="grid grid-cols-8 gap-1.5">
            {ICON_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedIcon(emoji)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                  selectedIcon === emoji
                    ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Accent Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                title={c.label}
                className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c.value }}
              >
                {selectedColor === c.value && (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
          {/* Preview card */}
          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl w-fit" style={{ backgroundColor: selectedColor + '20', border: `1px solid ${selectedColor}40` }}>
            <span className="text-2xl">{selectedIcon || '?'}</span>
            <span className="text-sm font-semibold" style={{ color: selectedColor }}>{name || 'Category Name'}</span>
          </div>
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}
