'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const CATEGORIES = [
  { value: 'worship',    label: 'Worship Service' },
  { value: 'prayer',     label: 'Prayer Meeting' },
  { value: 'conference', label: 'Conference' },
  { value: 'youth',      label: 'Youth Event' },
  { value: 'training',   label: 'Training' },
  { value: 'other',      label: 'Other' },
]

const PREDEFINED_TAGS = [
  'Worship', 'Prayer', 'Bible Study', 'Youth', 'Women', 'Men', 'Family',
  'Outreach', 'Conference', 'Training', 'Prophetic', 'Healing', 'Music',
  'Entertainment', 'Networking', 'Workshop',
]

export default function Step1Basics({ formData, updateForm, errors }: StepProps) {
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      updateForm('tags', formData.tags.filter((t: string) => t !== tag))
    } else {
      updateForm('tags', [...formData.tags, tag])
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Event Basics</h3>

      {/* Title */}
      <div>
        <label className={labelCls}>Event Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder="Enter event title"
          maxLength={100}
          className={inputCls}
        />
        {errors.title && <p className={errorCls}>{errors.title}</p>}
        <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder="Tell people what this event is about..."
          maxLength={2000}
          rows={6}
          className={`${inputCls} resize-none`}
        />
        {errors.description && <p className={errorCls}>{errors.description}</p>}
        <p className="text-xs text-gray-400 mt-1">{formData.description.length}/2000 characters</p>
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => updateForm('category', e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className={errorCls}>{errors.category}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Event Tags <span className="text-gray-400 font-normal">(optional)</span></label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                formData.tags.includes(tag)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {formData.tags.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">{formData.tags.length} tag{formData.tags.length > 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* More Details — collapsible */}
      <div className="pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`} />
          More Details
        </button>

        {showMoreDetails && (
          <div className="mt-4 space-y-4">
            {/* Speakers */}
            <div>
              <label className={labelCls}>Guest Speakers <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={formData.speakers || ''}
                onChange={(e) => updateForm('speakers', e.target.value)}
                placeholder="e.g., Pastor John Adeyemi, Apostle Grace..."
                className={inputCls}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.parking_available}
                  onChange={(e) => updateForm('parking_available', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">🅿️ Parking available</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.child_friendly}
                  onChange={(e) => updateForm('child_friendly', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">👨‍👩‍👧‍👦 Child friendly</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateForm('notes', e.target.value)}
                placeholder="Dress code, items to bring, special instructions..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
