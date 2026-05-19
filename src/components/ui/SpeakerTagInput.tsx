'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, UserPlus } from 'lucide-react'

interface Props {
  value: string          // comma-separated storage format
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export default function SpeakerTagInput({ value, onChange, placeholder = 'Type a name and press Enter', label }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const tags = value
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : []

  function addTag(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return
    const next = [...tags, trimmed]
    onChange(next.join(', '))
    setInput('')
    // Keep focus inside the box — don't let the page jump
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function removeTag(index: number) {
    const next = tags.filter((_, i) => i !== index)
    onChange(next.join(', '))
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      e.stopPropagation()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  function handleBlur() {
    if (input.trim()) addTag(input)
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          {label} <span className="text-gray-400 font-normal">(optional)</span>
        </label>
      )}
      <div
        className="min-h-[46px] w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent flex flex-wrap gap-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm font-medium px-2.5 py-1 rounded-lg"
          >
            {tag}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(i) }}
              className="text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : 'Add another...'}
          className="flex-1 min-w-[140px] text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent py-0.5"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
        <UserPlus className="w-3 h-3" />
        Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded font-mono">,</kbd> after each name
      </p>
    </div>
  )
}
