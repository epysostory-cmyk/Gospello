'use client'

import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
  goToStep: (step: number) => void
}

export default function Step6Review({ formData, updateForm, goToStep }: StepProps) {
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide'

  const EditBtn = ({ step }: { step: number }) => (
    <button
      type="button"
      onClick={() => goToStep(step)}
      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
    >
      <Pencil className="w-3 h-3" />
      Edit
    </button>
  )

  return (
    <div className="space-y-4">

      {/* Visibility Toggle */}
      <div className="bg-white rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          How should this event be published?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateForm('visibility', 'draft')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              formData.visibility === 'draft'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Save as Draft
          </button>
          <button
            type="button"
            onClick={() => updateForm('visibility', 'public')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              formData.visibility === 'public'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚀 Publish Now
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formData.visibility === 'draft'
            ? 'Save as draft to complete later. Only you can see it.'
            : 'Submit for admin review. Once approved, it will be visible to everyone.'}
        </p>
      </div>

      {/* Banner Preview */}
      {formData.banner_url && (
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className={labelCls}>Event Banner</p>
            <EditBtn step={4} />
          </div>
          <div className="relative h-40 rounded-xl overflow-hidden">
            <Image src={formData.banner_url} alt={formData.title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Event Summary — Step 1 */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className={labelCls}>Event Details</p>
          <EditBtn step={1} />
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-0.5">Title</p>
          <p className="font-semibold text-gray-900">{formData.title}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-0.5">Description</p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">{formData.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Category</p>
            <p className="font-medium text-gray-900 capitalize">{formData.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tags</p>
            <p className="font-medium text-gray-900 text-sm">
              {formData.tags.length > 0 ? formData.tags.join(', ') : <span className="text-gray-400">None</span>}
            </p>
          </div>
        </div>

        {/* Extra details if filled */}
        {(formData.speakers || formData.parking_available || formData.child_friendly || formData.notes) && (
          <div className="pt-2 border-t border-gray-100 space-y-1 text-sm text-gray-600">
            {formData.speakers && <p>🎤 Speakers: {formData.speakers}</p>}
            {formData.parking_available && <p>🅿️ Parking available</p>}
            {formData.child_friendly && <p>👨‍👩‍👧‍👦 Child friendly</p>}
            {formData.notes && <p>📝 Notes: {formData.notes}</p>}
          </div>
        )}
      </div>

      {/* Date & Time — Step 2 */}
      <div className="bg-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className={labelCls}>📅 Date & Time</p>
          <EditBtn step={2} />
        </div>
        <p className="text-gray-900 text-sm">
          <span className="font-medium">{formatDate(formData.start_date)}</span> at {formData.start_time}
        </p>
        {formData.end_date && (
          <p className="text-gray-600 text-sm">
            Ends {formatDate(formData.end_date)} at {formData.end_time || '—'}
          </p>
        )}
      </div>

      {/* Location — Step 3 */}
      <div className="bg-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className={labelCls}>{formData.is_online ? '🌐 Online Event' : '📍 Location'}</p>
          <EditBtn step={3} />
        </div>
        {formData.is_online ? (
          <div className="space-y-1 text-sm">
            {formData.online_platform && (
              <p className="font-medium text-gray-900">{formData.online_platform}</p>
            )}
            <p className="text-gray-600 break-all">{formData.online_link}</p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{formData.location_name}</p>
            {formData.address && <p className="text-gray-600">{formData.address}</p>}
            <p className="text-gray-600">{formData.city}, {formData.state}</p>
          </div>
        )}
      </div>

      {/* Pricing & Entry — Step 5 */}
      <div className="bg-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className={labelCls}>Entry & Registration</p>
          <EditBtn step={5} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Entry</p>
            <p className="font-medium text-gray-900">
              {formData.is_free
                ? '🎁 Free'
                : `💳 ${formData.currency} ${formData.price}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Registration</p>
            <p className="font-medium text-gray-900">
              {formData.rsvp_required
                ? `RSVP Required${formData.capacity ? ` (${formData.capacity} spots)` : ' (Unlimited)'}`
                : 'No RSVP'}
            </p>
          </div>
        </div>

        {!formData.is_free && formData.payment_link && (
          <p className="text-xs text-gray-500 truncate">🔗 {formData.payment_link}</p>
        )}
      </div>


      {/* Ready to go */}
      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
        <p className="text-sm font-semibold text-indigo-900 mb-1">✅ Looking good!</p>
        <p className="text-sm text-indigo-700">
          {formData.visibility === 'draft'
            ? 'Your draft will be saved and you can edit it anytime from your dashboard.'
            : 'Your event will be submitted for admin review and published once approved.'}
        </p>
      </div>
    </div>
  )
}
