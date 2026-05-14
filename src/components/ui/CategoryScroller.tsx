'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
}

export default function CategoryScroller({ categories, activeSlug, allUrl }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft]   = useState(false)
  const [canRight, setCanRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    // Re-check after fonts/layout settle
    const t = setTimeout(checkScroll, 150)
    const el = scrollRef.current
    el?.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    const ro = new ResizeObserver(checkScroll)
    if (el) ro.observe(el)
    return () => {
      clearTimeout(t)
      el?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
      ro.disconnect()
    }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  const allItems = [{ slug: '', name: 'All', icon: null, url: allUrl }, ...categories]

  return (
    <div className="relative flex items-center gap-1">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        disabled={!canLeft}
        className={`flex-shrink-0 w-7 h-7 rounded-full border bg-white flex items-center justify-center transition-all ${
          canLeft ? 'border-gray-300 hover:bg-gray-50 text-gray-600' : 'border-gray-100 text-gray-300 cursor-default'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scrollable pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {allItems.map((cat) => {
          const active = cat.slug === '' ? !activeSlug : activeSlug === cat.slug
          return (
            <Link
              key={cat.slug || 'all'}
              href={cat.url}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              {cat.icon && <span className="text-sm leading-none">{cat.icon}</span>}
              {cat.name}
            </Link>
          )
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        disabled={!canRight}
        className={`flex-shrink-0 w-7 h-7 rounded-full border bg-white flex items-center justify-center transition-all ${
          canRight ? 'border-gray-300 hover:bg-gray-50 text-gray-600' : 'border-gray-100 text-gray-300 cursor-default'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
