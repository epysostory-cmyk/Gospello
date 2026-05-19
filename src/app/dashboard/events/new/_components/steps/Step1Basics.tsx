'use client'

import { useState } from 'react'
import type { CategoryRow } from '@/app/actions/categories'
import SpeakerTagInput from '@/components/ui/SpeakerTagInput'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
  categories?: CategoryRow[]
}

const FALLBACK_CATEGORIES = [
  { slug: 'worship',    name: 'Worship Night' },
  { slug: 'conference', name: 'Conference' },
  { slug: 'prayer',     name: 'Prayer Event' },
  { slug: 'youth',      name: 'Youth Program' },
  { slug: 'concerts',   name: 'Concert' },
  { slug: 'training',   name: 'Training' },
  { slug: 'crusades',   name: 'Crusade' },
  { slug: 'podcasts',   name: 'Podcast' },
  { slug: 'other',      name: 'Other' },
]

const PREDEFINED_TAGS = [
  'Worship', 'Prayer', 'Bible Study', 'Youth', 'Women', 'Men', 'Family',
  'Outreach', 'Conference', 'Training', 'Prophetic', 'Healing', 'Music',
  'Entertainment', 'Networking', 'Workshop',
]

const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors'

export default function Step1Basics({ formData, updateForm, errors, categories }: StepProps) {
  const [showExtra, setShowExtra] = useState(false)
  const catList = (categories && categories.length > 0) ? categories : FALLBACK_CATEGORIES

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      updateForm('tags', formData.tags.filter((t: string) => t !== tag))
    } else {
      updateForm('tags', [...formData.tags, tag])
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          Event name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={e => updateForm('title', e.target.value)}
          placeholder="e.g. Next Level Prayer Conference 2026"
          maxLength={100}
          className={inp}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          What is this event about? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={e => updateForm('description', e.target.value)}
          placeholder="Describe the event — theme, what attendees will experience, who it's for..."
          maxLength={2000}
          rows={5}
          className={`${inp} resize-none`}
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-400 mt-1">{formData.description.length}/2000</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={e => updateForm('category', e.target.value)}
          className={inp}
        >
          {catList.map(cat => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          Tags <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">Tap any that apply — helps people find your event</p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`h-8 px-3 rounded-full text-[13px] font-medium border transition-colors ${
                formData.tags.includes(tag)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          {showExtra ? 'Hide extra details' : '+ Add speakers, parking, dress code...'}
        </button>

        {showExtra && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Ministers & Speakers <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <SpeakerTagInput
                value={formData.speakers || ''}
                onChange={v => updateForm('speakers', v)}
                placeholder="e.g. Pastor Biodun Fatoyinbo"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Additional Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {([
                  ['parking_available',       'Parking available',              false],
                  ['shuttle_available',        'Bus / shuttle available',        false],
                  ['child_friendly',           'Child-friendly',                 true],
                  ['wheelchair_accessible',    'Wheelchair accessible',          false],
                  ['food_provided',            'Food / refreshments provided',   false],
                  ['accommodation_available',  'Accommodation available',        false],
                  ['no_recording',             'No recording allowed',           true],
                ] as [string, string, boolean][])
                  .filter(([,, onlineOk]) => !formData.is_online || onlineOk)
                  .map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox"
                      checked={!!(formData as any)[key]}
                      onChange={e => updateForm(key as any, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Dress code — physical events only */}
              {!formData.is_online && <div className="mt-3">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input type="checkbox"
                    checked={!!(formData as any).dress_code}
                    onChange={e => updateForm('dress_code' as any, e.target.checked ? 'Smart casual' : '')}
                    className="w-4 h-4 rounded border-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Dress code required</span>
                </label>
                {!!(formData as any).dress_code && (
                  <input
                    type="text"
                    value={(formData as any).dress_code || ''}
                    onChange={e => updateForm('dress_code' as any, e.target.value)}
                    placeholder="e.g. Smart casual, All-white, Native attire"
                    className={`${inp} mt-1`}
                  />
                )}
              </div>}

              {/* Gender restriction */}
              <div className="mt-3">
                <label className="block text-sm text-gray-700 mb-1.5">Audience restriction</label>
                <select
                  value={(formData as any).gender_restriction || ''}
                  onChange={e => updateForm('gender_restriction' as any, e.target.value)}
                  className={inp}
                >
                  <option value="">Open to everyone</option>
                  <option value="women_only">Women only</option>
                  <option value="men_only">Men only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Additional notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={e => updateForm('notes', e.target.value)}
                placeholder="Anything else attendees should know..."
                rows={3}
                className={`${inp} resize-none`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
