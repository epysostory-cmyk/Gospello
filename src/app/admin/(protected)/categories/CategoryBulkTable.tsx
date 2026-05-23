'use client'

import { useState, useTransition } from 'react'
import { Loader2, Search, Eye, EyeOff, Trash2, X } from 'lucide-react'
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
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? cats.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.slug.toLowerCase().includes(query.toLowerCase())
      )
    : cats

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
      <div className="py-20 text-center px-6">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏷️</span>
        </div>
        <p className="text-gray-700 font-semibold text-base">No categories yet</p>
        <p className="text-gray-400 text-sm mt-1">Tap &ldquo;+ New&rdquo; above to create the first one.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
          />
        </div>
        {query && (
          <p className="text-xs text-gray-400 mt-1.5 px-1">
            {filtered.length} of {cats.length} categories
          </p>
        )}
      </div>

      {/* Select-all row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <label className="flex items-center gap-3 cursor-pointer select-none min-h-[44px]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-5 h-5 rounded-md border-gray-300 accent-indigo-600 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-600">
            {someSelected ? `${selected.size} of ${cats.length} selected` : 'Select all'}
          </span>
        </label>
        {isPending && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* Category cards */}
      <div className="divide-y divide-gray-100">
        {filtered.length === 0 && query && (
          <div className="py-12 text-center text-sm text-gray-400">
            No categories match &ldquo;{query}&rdquo;
          </div>
        )}
        {filtered.map((cat, idx) => {
          const accentColor = cat.color ?? '#6B7280'
          const eventCount = countMap[cat.slug] ?? 0
          const isChecked = selected.has(cat.id)

          return (
            <div
              key={cat.id}
              className={`px-4 py-4 transition-colors ${isChecked ? 'bg-indigo-50/70' : 'hover:bg-gray-50/60'}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox — large tap target */}
                <div className="flex-shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(cat.id)}
                    className="w-5 h-5 rounded-md border-gray-300 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Color bar */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        cat.is_visible
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {cat.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {/* Slug + count */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs text-gray-400 font-mono">{cat.slug}</code>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {eventCount} {eventCount === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  {/* Description */}
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{cat.description}</p>
                  )}

                  {/* Row actions */}
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
                      isLast={idx === filtered.length - 1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky bulk-action bar — slides up when items selected */}
      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:sticky sm:bottom-0">
          <div className="bg-gray-900 text-white px-4 py-3 sm:mx-0 sm:rounded-b-2xl shadow-2xl border-t border-gray-800">
            {!showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(new Set())}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors mr-1"
                  title="Clear selection"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
                <span className="text-sm font-semibold text-gray-200 flex-1">
                  {selected.size} selected
                </span>
                <button
                  onClick={handleBulkShow}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Show
                </button>
                <button
                  onClick={handleBulkHide}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 active:scale-95"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-200 flex-1">
                  Delete <span className="font-bold text-white">{selected.size}</span> {selected.size === 1 ? 'category' : 'categories'}?
                </span>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 active:scale-95"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Yes, delete
                </button>
              </div>
            )}
          </div>
          {/* Safe area spacer for iOS */}
          <div className="bg-gray-900 h-safe-area-inset-bottom sm:hidden" />
        </div>
      )}
    </div>
  )
}
