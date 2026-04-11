'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Star } from 'lucide-react'

interface Props {
  id: string
  table: 'events' | 'churches'
  isFeatured: boolean
}

export default function FeaturedToggle({ id, table, isFeatured }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [featured, setFeatured] = useState(isFeatured)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const newVal = !featured
    setFeatured(newVal)

    await supabase
      .from(table)
      .update({ is_featured: newVal })
      .eq('id', id)

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
        featured
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Star className={`w-3.5 h-3.5 ${featured ? 'fill-amber-500' : ''}`} />
      )}
      {featured ? 'Featured' : 'Feature'}
    </button>
  )
}
