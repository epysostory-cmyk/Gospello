'use client'

import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function Step6Review({ formData, updateForm, errors }: StepProps) {
  const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'

  return (
    <div className="space-y-4">
      {/* Visibility Toggle */}
      <div className="bg-white rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">How should this event be published?</label>
        <div className="flex gap-3">
          <button
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
            : 'Publish to submit for admin review. Once approved, it will be visible to everyone.'}
        </p>
      </div>

      {/* Banner Preview */}
      {formData.banner_url && (
        <div className="bg-white rounded-2xl p-6">
          <p className={labelCls}>Event Banner</p>
          <div className="relative h-40 rounded-lg overflow-hidden">
            <Image src={formData.banner_url} alt={formData.title} fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Event Summary */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div>
          <p className={labelCls}>Event Title</p>
          <p className="font-semibold text-gray-900">{formData.title}</p>
        </div>

        <div>
          <p className={labelCls}>Description</p>
          <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{formData.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={labelCls}>Category</p>
            <p className="font-medium text-gray-900 capitalize">{formData.category}</p>
          </div>

          <div>
            <p className={labelCls}>Tags</p>
            <p className="font-medium text-gray-900">{formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}</p>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <p className={labelCls}>📅 Date & Time</p>
        <div className="space-y-3">
          <p className="text-gray-900">
            {formatDate(formData.start_date)} at {formData.start_time}
          </p>
          {formData.end_date && (
            <p className="text-gray-900">
              Ends {formatDate(formData.end_date)} at {formData.end_time || '—'}
            </p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        {formData.is_online ? (
          <>
            <p className={labelCls}>🌐 Online Event</p>
            <div className="space-y-2">
              {formData.online_platform && <p className="text-gray-900">{formData.online_platform}</p>}
              <p className="text-sm text-gray-600 break-all">{formData.online_link}</p>
            </div>
          </>
        ) : (
          <>
            <p className={labelCls}>📍 Location</p>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{formData.location_name}</p>
              {formData.address && <p className="text-gray-700">{formData.address}</p>}
              <p className="text-gray-700">
                {formData.city}, {formData.state}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Pricing & Entry */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div>
          <p className={labelCls}>Entry Type</p>
          <p className="font-medium text-gray-900">
            {formData.is_free ? '🎁 Free Event' : `💳 Paid (${formData.currency} ${formData.price})`}
          </p>
        </div>

        <div>
          <p className={labelCls}>Registration</p>
          <p className="font-medium text-gray-900">
            {formData.rsvp_required ? `RSVP Required (Capacity: ${formData.capacity})` : 'No RSVP Required'}
          </p>
        </div>
      </div>

      {/* Gallery */}
      {formData.gallery_urls.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <p className={labelCls}>Gallery ({formData.gallery_urls.length} images)</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {formData.gallery_urls.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Info */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
        <p className="text-sm font-medium text-indigo-900 mb-2">✅ Review Complete</p>
        <p className="text-sm text-indigo-800">
          {formData.visibility === 'draft'
            ? "Your draft will be saved and you can edit it anytime from your dashboard."
            : 'Your event will be submitted for admin review. It will be visible to the public once approved.'}
        </p>
      </div>
    </div>
  )
}
