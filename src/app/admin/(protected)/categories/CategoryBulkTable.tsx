'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import CategoryRowActions from './CategoryRowActions'
import { bulkDeleteCategories, bulkSetCategoryVisibility } from './actions'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_visible: boolean | null
  sort_order: number
}

interface Props {
  cats: Category[]
  countMap: Record<string, number>
}

export default function CategoryBulkTable({ cats, countMap }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const allIds = cats.map(c => c.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  const handleBulkDelete = () => {
    startTransition(async () => {
      await bulkDeleteCategories(Array.from(selected))
      setSelected(new Set())
      setShowDeleteConfirm(false)
    })
  }

  const handleBulkShow = () => {
    startTransition(async () => {
      await bulkSetCategoryVisibility(Array.from(selected), true)
      setSelected(new Set())
    })
  }

  const handleBulkHide = () => {
    startTransition(async () => {
      await bulkSetCategoryVisibility(Array.from(selected), false)
      setSelected(new Set())
    })
  }

  if (cats.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-sm">No categories yet.</p>
        <p className="text-gray-400 text-sm mt-1">Click &ldquo;+ New Category&rdquo; above to add the first one.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Select all row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
          />
          <span className="text-sm text-gray-500">
            {someSelected ? `${selected.size} of ${cats.length} selected` : 'Select all'}
          </span>
        </label>

        {/* Bulk actions */}
        {someSelected && (
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            <button
              onClick={handleBulkShow}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium transition-colors disabled:opacity-50"
            >
              Show all
            </button>
            <button
              onClick={handleBulkHide}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              Hide all
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-medium transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Delete {selected.size}?</span>
                <button
                  onClick={handleBulkDelete}
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
        )}
      </div>

      {/* Category cards */}
      <div className="divide-y divide-gray-100">
        {cats.map((cat, idx) => {
          const accentColor = cat.color ?? '#6B7280'
          const eventCount = countMap[cat.slug] ?? 0
          const isChecked = selected.has(cat.id)

          return (
            <div
              key={cat.id}
              className={`px-4 py-4 transition-colors ${isChecked ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(cat.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Color bar */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            cat.is_visible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          {cat.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {eventCount} {eventCount === 1 ? 'event' : 'events'}
                        </span>
                      </div>
                      <code className="text-xs text-gray-400 font-mono mt-0.5 block">{cat.slug}</code>
                      {cat.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-3">
                    <CategoryRowActions
                      id={cat.id}
                      slug={cat.slug}
                      name={cat.name}
                      description={cat.description ?? ''}
                      icon={cat.icon ?? ''}
                      color={cat.color ?? '#6B7280'}
                      isVisible={cat.is_visible ?? true}
                      isFirst={idx === 0}
                      isLast={idx === cats.length - 1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
