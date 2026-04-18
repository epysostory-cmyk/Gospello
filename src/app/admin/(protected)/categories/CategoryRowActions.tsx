'use client'

import { useState, useTransition } from 'react'
import { Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Loader2, Pencil, Check, X } from 'lucide-react'
import { deleteCategory, toggleCategoryVisibility, updateSortOrder, updateCategory } from './actions'

const ICON_OPTIONS = [
  '🙏','🔥','✨','🕊️','🙌','👐','🫶','🌊',
  '🎵','🎤','🎶','🎸','🥁','🎺','🎻','🎹',
  '⛪','🏛️','📖','📜','✝️','💒','🛐','📿',
  '👥','🌟','💫','🌍','🤝','🧑‍🤝‍🧑','🫂','🌺',
  '🎙️','📻','📺','💻','📱','🎧','📡','🔊',
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

interface Props {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  isVisible: boolean
  isFirst: boolean
  isLast: boolean
}

export default function CategoryRowActions({
  id, slug, name, description, icon, color, isVisible, isFirst, isLast,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  // edit form state
  const [editName, setEditName] = useState(name)
  const [editDesc, setEditDesc] = useState(description)
  const [editIcon, setEditIcon] = useState(icon)
  const [editColor, setEditColor] = useState(color)
  const [editError, setEditError] = useState('')

  const openEdit = () => {
    setEditName(name)
    setEditDesc(description)
    setEditIcon(icon)
    setEditColor(color)
    setEditError('')
    setShowEdit(true)
  }

  const handleSave = () => {
    setEditError('')
    startTransition(async () => {
      const result = await updateCategory(id, {
        name: editName,
        description: editDesc,
        icon: editIcon,
        color: editColor,
      })
      if (result?.error) {
        setEditError(result.error)
      } else {
        setShowEdit(false)
      }
    })
  }

  const handleToggleVisibility = () => {
    startTransition(() => toggleCategoryVisibility(id, isVisible))
  }

  const handleMoveUp = () => {
    startTransition(() => updateSortOrder(id, 'up'))
  }

  const handleMoveDown = () => {
    startTransition(() => updateSortOrder(id, 'down'))
  }

  const handleDelete = () => {
    startTransition(() => deleteCategory(id))
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className="flex items-center gap-1 justify-end">
        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 mr-1" />}

        {/* Sort order */}
        <button
          onClick={handleMoveUp}
          disabled={isFirst || isPending}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          title="Move up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMoveDown}
          disabled={isLast || isPending}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          title="Move down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {/* Edit */}
        <button
          onClick={openEdit}
          disabled={isPending}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-30"
          title="Edit category"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Visibility */}
        <button
          onClick={handleToggleVisibility}
          disabled={isPending}
          className={`p-1.5 rounded-lg transition-colors ${
            isVisible
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-gray-600 hover:bg-white/10 hover:text-gray-400'
          }`}
          title={isVisible ? 'Hide from website' : 'Show on website'}
        >
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending || slug === 'other'}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
            title={slug === 'other' ? 'Cannot delete default category' : 'Delete category'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs px-2 py-1 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Edit Category</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {editError}
                </p>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Slug (read-only) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Slug <span className="text-gray-600">(cannot be changed)</span></label>
                <code className="block w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm">{slug}</code>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description <span className="text-gray-600">(optional)</span></label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Icon *
                  {editIcon && <span className="ml-2 text-white text-base">{editIcon} selected</span>}
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditIcon(emoji)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                        editIcon === emoji
                          ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditColor(c.value)}
                      title={c.label}
                      className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c.value }}
                    >
                      {editColor === c.value && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl w-fit" style={{ backgroundColor: editColor + '20', border: `1px solid ${editColor}40` }}>
                  <span className="text-2xl">{editIcon || '?'}</span>
                  <span className="text-sm font-semibold" style={{ color: editColor }}>{editName || 'Category Name'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
