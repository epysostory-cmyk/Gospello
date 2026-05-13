'use client'

import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
  goToStep: (step: number) => void
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-900 font-medium break-words">{value || '—'}</p>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-xs text-indigo-600 font-medium flex-shrink-0 mt-4">Edit</button>
      )}
    </div>
  )
}

export default function Step6Review({ formData, updateForm, goToStep }: StepProps) {
  const dateStr = formData.event_type === 'multi'
    ? `${formatDate(formData.start_date)} – ${formatDate(formData.end_date)}`
    : `${formatDate(formData.start_date)}${formData.start_time ? ` at ${formData.start_time}` : ''}`

  const locationStr = formData.is_online
    ? `Online${formData.online_platform ? ` · ${formData.online_platform}` : ''}`
    : [formData.location_name, formData.city, formData.state].filter(Boolean).join(', ')

  const entryStr = formData.registration_type === 'paid'
    ? `${formData.currency} ${formData.price}`
    : formData.registration_type === 'free_registration'
    ? 'Free — Registration required'
    : 'Free — No registration'

  return (
    <div className="space-y-6">

      {/* Publish / Draft */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Ready to publish?</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => updateForm('visibility', 'public')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              formData.visibility === 'public' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Submit for Review
          </button>
          <button type="button" onClick={() => updateForm('visibility', 'draft')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              formData.visibility === 'draft' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Save as Draft
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {formData.visibility === 'draft'
            ? 'Saved as a draft. Only you can see it until you publish.'
            : 'Will be reviewed by our team and published once approved.'}
        </p>
      </div>

      {/* Banner */}
      {formData.banner_url && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flyer</p>
            <button type="button" onClick={() => goToStep(4)} className="text-xs text-indigo-600 font-medium">Edit</button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
            <Image src={formData.banner_url} alt={formData.title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
        <Row label="Event name" value={formData.title} onEdit={() => goToStep(1)} />
        <Row label="Category" value={formData.category} />
        {formData.tags?.length > 0 && <Row label="Tags" value={formData.tags.join(', ')} />}
        <Row label="Date & time" value={dateStr} onEdit={() => goToStep(2)} />
        <Row label="Location" value={locationStr} onEdit={() => goToStep(3)} />
        <Row label="Entry" value={entryStr} onEdit={() => goToStep(5)} />
        {formData.speakers && <Row label="Speakers" value={formData.speakers} />}
      </div>

      {/* Description preview */}
      {formData.description && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">About</p>
            <button type="button" onClick={() => goToStep(1)} className="text-xs text-indigo-600 font-medium">Edit</button>
          </div>
          <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">{formData.description}</p>
        </div>
      )}
    </div>
  )
}
