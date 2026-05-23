'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Loader2, Check, ChevronUp, ChevronDown,
  Pencil, Eye, EyeOff, Trash2, X,
} from 'lucide-react'
import { deleteCategory, toggleCategoryVisibility, updateSortOrder, updateCategory } from './actions'

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

  const [editName, setEditName] = useState(name)
  const [editSlug, setEditSlug] = useState(slug)
  const [editDesc, setEditDesc] = useState(description)
  const [editColor, setEditColor] = useState(color)
  const [editError, setEditError] = useState('')

  const openEdit = () => {
    setEditName(name)
    setEditSlug(slug)
    setEditDesc(description)
    setEditColor(color)
    setEditError('')
    setShowEdit(true)
  }

  // Lock body scroll when edit sheet open
  useEffect(() => {
    if (showEdit) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showEdit])

  const handleSave = () => {
    setEditError('')
    startTransition(async () => {
      const result = await updateCategory(id, slug, {
        name: editName,
        slug: editSlug,
        description: editDesc,
        icon,
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
      {/* Action strip — icon buttons, large tap targets */}
      <div className="flex items-center gap-1">
        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 mr-1" />}

        {/* Reorder */}
        <button
          onClick={handleMoveUp}
          disabled={isFirst || isPending}
          title="Move up"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleMoveDown}
          disabled={isLast || isPending}
          title="Move down"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Edit */}
        <button
          onClick={openEdit}
          disabled={isPending}
          title="Edit"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Visibility toggle */}
        <button
          onClick={handleToggleVisibility}
          disabled={isPending}
          title={isVisible ? 'Hide category' : 'Show category'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors active:scale-95 ${
            isVisible
              ? 'text-gray-500 hover:bg-gray-100 active:bg-gray-200'
              : 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
          }`}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending || slug === 'other'}
            title={slug === 'other' ? 'Cannot delete default category' : 'Delete'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 ml-1 bg-red-50 rounded-xl px-2 py-1 border border-red-200">
            <span className="text-xs text-red-600 font-medium">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs px-2.5 py-1 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Edit — bottom sheet on mobile, centered modal on sm+ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:duration-200">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit Category</h2>
                <p className="text-xs text-gray-400 mt-0.5">Changes apply immediately</p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {editError}
                </p>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  placeholder="Category name"
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Slug *
                  {editSlug !== slug && (
                    <span className="ml-2 text-amber-600 text-xs font-normal bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      All events will be updated
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+$/g, ''))}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1 px-1">Lowercase letters, numbers and hyphens only</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">Accent Color</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditColor(c.value)}
                      title={c.label}
                      className={`relative w-10 h-10 rounded-full transition-all active:scale-95 ${
                        editColor === c.value
                          ? 'ring-3 ring-offset-2 ring-gray-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    >
                      {editColor === c.value && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <span
                    className="text-sm font-semibold px-3.5 py-1.5 rounded-full"
                    style={{ backgroundColor: editColor + '20', color: editColor }}
                  >
                    {editName || 'Preview'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !editName.trim() || !editSlug.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-2xl transition-colors disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
