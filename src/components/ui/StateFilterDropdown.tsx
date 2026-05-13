'use client'

import { useRouter } from 'next/navigation'

interface Props {
  states: string[]
  currentState?: string
  currentQ?: string
}

export default function StateFilterDropdown({ states, currentState, currentQ }: Props) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const state = e.target.value
    const qs = new URLSearchParams()
    if (currentQ) qs.set('q', currentQ)
    if (state) qs.set('state', state)
    router.push(`/churches?${qs.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
      <label className="text-sm font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
        Filter by state
      </label>
      <select
        value={currentState ?? ''}
        onChange={handleChange}
        className="flex-1 max-w-xs bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
      >
        <option value="">All states</option>
        {states.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {currentState && (
        <button
          onClick={() => {
            const qs = new URLSearchParams()
            if (currentQ) qs.set('q', currentQ)
            router.push(`/churches?${qs.toString()}`)
          }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
        >
          Clear
        </button>
      )}
    </div>
  )
}
