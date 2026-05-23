'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Category {
  slug: string
  name: string
  color?: string | null
}

export default function HomeCategoryScroller({ categories }: { categories: Category[] }) {
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

  return (
    <div className="border-b border-gray-100 py-3">
      <div className="flex items-center gap-1 sm:px-6 lg:px-8">
        {/* Arrows — desktop only */}
        <button
          onClick={() => scroll('left')}
          disabled={!canLeft}
          className={`hidden sm:flex flex-shrink-0 w-7 h-7 rounded-full border bg-white items-center justify-center transition-all ${
            canLeft ? 'border-gray-300 hover:bg-gray-50 text-gray-600' : 'border-gray-100 text-gray-300 cursor-default'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable chips */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/events?category=${cat.slug}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color ?? '#6B7280' }}
              />
              {cat.name}
            </Link>
          ))}
          <Link
            href="/categories"
            className="flex-shrink-0 flex items-center gap-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-500 whitespace-nowrap"
          >
            All categories
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Right arrow — desktop only */}
        <button
          onClick={() => scroll('right')}
          disabled={!canRight}
          className={`hidden sm:flex flex-shrink-0 w-7 h-7 rounded-full border bg-white items-center justify-center transition-all ${
            canRight ? 'border-gray-300 hover:bg-gray-50 text-gray-600' : 'border-gray-100 text-gray-300 cursor-default'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
