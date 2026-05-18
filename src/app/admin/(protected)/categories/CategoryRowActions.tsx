'use client'

import { useState, useTransition } from 'react'
import { Loader2, Check } from 'lucide-react'
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
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}

        {/* Reorder */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMoveUp}
            disabled={isFirst || isPending}
            className="text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            ↑ Up
          </button>
          <button
            onClick={handleMoveDown}
            disabled={isLast || isPending}
            className="text-xs px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            ↓ Down
          </button>
        </div>

        {/* Edit */}
        <button
          onClick={openEdit}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 transition-colors font-medium"
        >
          Edit
        </button>

        {/* Visibility */}
        <button
          onClick={handleToggleVisibility}
          disabled={isPending}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            isVisible
              ? 'text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border-gray-200'
              : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
          }`}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending || slug === 'other'}
            title={slug === 'other' ? 'Cannot delete default category' : undefined}
            className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-100 hover:border-red-200 transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Sure?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs px-3 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Edit Category</h2>
                <p className="text-xs text-gray-500 mt-0.5">Changes apply immediately after saving</p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {editError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  autoFocus
                  placeholder="Category name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers and hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditColor(c.value)}
                      title={c.label}
                      className={`relative w-8 h-8 rounded-full transition-all ${
                        editColor === c.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    >
                      {editColor === c.value && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-3 inline-flex">
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: editColor + '18', color: editColor }}
                  >
                    {editName || 'Preview'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !editName.trim() || !editSlug.trim()}
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
