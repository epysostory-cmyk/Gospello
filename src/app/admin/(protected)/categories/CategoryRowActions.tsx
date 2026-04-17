'use client'

import { useState, useTransition } from 'react'
import { Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'
import { deleteCategory, toggleCategoryVisibility, updateSortOrder } from './actions'

interface Props {
  id: string
  slug: string
  isVisible: boolean
  isFirst: boolean
  isLast: boolean
}

export default function CategoryRowActions({ id, slug, isVisible, isFirst, isLast }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
    <div className="flex items-center gap-1">
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
  )
}
