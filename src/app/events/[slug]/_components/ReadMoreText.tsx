'use client'

import { useState } from 'react'

interface Props {
  text: string
  limit?: number
}

export default function ReadMoreText({ text, limit = 300 }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (text.length <= limit) {
    return (
      <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
        {text}
      </p>
    )
  }

  return (
    <div>
      <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
        {expanded ? text : text.slice(0, limit) + '…'}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  )
}
