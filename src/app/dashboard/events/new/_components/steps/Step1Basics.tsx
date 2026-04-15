'use client'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const CATEGORIES = [
  { value: 'worship', label: 'Worship Service' },
  { value: 'prayer', label: 'Prayer Meeting' },
  { value: 'conference', label: 'Conference' },
  { value: 'youth', label: 'Youth Event' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

export default function Step1Basics({ formData, updateForm, errors }: StepProps) {
  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

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
          placeholder="Tell us about your event..."
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
    </div>
  )
}
