'use client'

import { useState, useTransition } from 'react'
import { Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
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

  const clearSelection = () => setSelected(new Set())

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

  return (
    <div>
      {/* Bulk action toolbar */}
      {someSelected && (
        <div className="mb-3 flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-sm text-gray-700 font-medium mr-1">
            {selected.size} selected
          </span>

          <button
            onClick={handleBulkShow}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            Show
          </button>

          <button
            onClick={handleBulkHide}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Hide
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete {selected.size} categories?</span>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={clearSelection}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>

          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 bg-white accent-indigo-500 cursor-pointer"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No categories yet. Add your first category above.
                </td>
              </tr>
            ) : (
              cats.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className={`border-b border-gray-100 transition-colors ${
                    selected.has(cat.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.has(cat.id)}
                      onChange={() => toggle(cat.id)}
                      className="rounded border-gray-300 bg-white accent-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Icon + Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: (cat.color ?? '#6B7280') + '25' }}
                      >
                        {cat.icon || '⛪'}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]">{cat.description}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{cat.slug}</code>
                  </td>

                  {/* Event count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-sm font-semibold text-gray-900">{countMap[cat.slug] ?? 0}</span>
                  </td>

                  {/* Visibility badge */}
                  <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      cat.is_visible
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.is_visible ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                      {cat.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
