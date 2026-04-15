'use client'

import { NIGERIAN_STATES } from '@/lib/utils'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const ONLINE_PLATFORMS = [
  'Zoom',
  'YouTube Live',
  'Google Meet',
  'Facebook Live',
  'WhatsApp',
  'Telegram',
  'Other',
]

export default function Step3Location({ formData, updateForm, errors }: StepProps) {
  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Location</h3>

      {/* Toggle Physical/Online */}
      <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
        <button
          onClick={() => updateForm('is_online', false)}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
            !formData.is_online
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          📍 Physical Location
        </button>
        <button
          onClick={() => updateForm('is_online', true)}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
            formData.is_online
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          🌐 Online Event
        </button>
      </div>

      {/* Physical Location Fields */}
      {!formData.is_online && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Location Name *</label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => updateForm('location_name', e.target.value)}
              placeholder="e.g., Grace Sanctuary Church, City Centre"
              className={inputCls}
            />
            {errors.location_name && <p className={errorCls}>{errors.location_name}</p>}
          </div>

          <div>
            <label className={labelCls}>Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateForm('address', e.target.value)}
              placeholder="e.g., 123 Main Street"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateForm('city', e.target.value)}
              placeholder="e.g., Lagos, Ibadan"
              className={inputCls}
            />
            {errors.city && <p className={errorCls}>{errors.city}</p>}
          </div>

          <div>
            <label className={labelCls}>State *</label>
            <select
              value={formData.state}
              onChange={(e) => updateForm('state', e.target.value)}
              className={inputCls}
            >
              <option value="">Select a state</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && <p className={errorCls}>{errors.state}</p>}
          </div>
        </div>
      )}

      {/* Online Event Fields */}
      {formData.is_online && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Platform (Optional)</label>
            <select
              value={formData.online_platform}
              onChange={(e) => updateForm('online_platform', e.target.value)}
              className={inputCls}
            >
              <option value="">Select platform</option>
              {ONLINE_PLATFORMS.map((plat) => (
                <option key={plat} value={plat}>
                  {plat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Join Link *</label>
            <input
              type="url"
              value={formData.online_link}
              onChange={(e) => updateForm('online_link', e.target.value)}
              placeholder="e.g., https://zoom.us/j/123456..."
              className={inputCls}
            />
            {errors.online_link && <p className={errorCls}>{errors.online_link}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
