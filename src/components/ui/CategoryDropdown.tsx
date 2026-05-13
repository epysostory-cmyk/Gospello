'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutGrid, Check } from 'lucide-react'

interface CategoryItem {
  slug: string
  name: string
  icon?: string | null
  url: string
}

interface Props {
  categories: CategoryItem[]
  activeSlug: string | undefined
  allUrl: string
  activeLabel: string | null
}

export default function CategoryDropdown({ categories, activeSlug, allUrl, activeLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-9 pl-3.5 pr-3 rounded-xl border text-sm font-semibold transition-all ${
          activeSlug
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{activeLabel ?? 'Categories'}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          style={{ minWidth: '300px' }}
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Browse by Category</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs font-medium">close</button>
          </div>

          {/* All Events */}
          <Link
            href={allUrl}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between px-4 py-3 text-sm font-semibold border-b border-gray-100 transition-colors ${
              !activeSlug ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>All Events</span>
            {!activeSlug && <Check className="w-4 h-4 text-gray-900" />}
          </Link>

          {/* Category grid — 2 columns */}
          <div className="grid grid-cols-2 gap-1 p-2">
            {categories.map((cat) => {
              const active = activeSlug === cat.slug
              return (
                <Link
                  key={cat.slug}
                  href={cat.url}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.icon && <span className="text-base leading-none flex-shrink-0">{cat.icon}</span>}
                  <span className="truncate">{cat.name}</span>
                  {active && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-80" />}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
