'use client'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

export default function Step2DateTime({ formData, updateForm, errors }: StepProps) {
  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>

      {/* Start Date */}
      <div>
        <label className={labelCls}>Start Date *</label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => updateForm('start_date', e.target.value)}
          min={today}
          className={inputCls}
        />
        {errors.start_date && <p className={errorCls}>{errors.start_date}</p>}
      </div>

      {/* Start Time */}
      <div>
        <label className={labelCls}>Start Time *</label>
        <input
          type="time"
          value={formData.start_time}
          onChange={(e) => updateForm('start_time', e.target.value)}
          className={inputCls}
        />
        {errors.start_time && <p className={errorCls}>{errors.start_time}</p>}
      </div>

      {/* End Date */}
      <div>
        <label className={labelCls}>End Date (Optional)</label>
        <input
          type="date"
          value={formData.end_date}
          onChange={(e) => updateForm('end_date', e.target.value)}
          min={formData.start_date || today}
          className={inputCls}
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty if single-day event</p>
      </div>

      {/* End Time */}
      {formData.end_date && (
        <div>
          <label className={labelCls}>End Time (Optional)</label>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) => updateForm('end_time', e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {/* Info */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-indigo-800">
          💡 <strong>Tip:</strong> Set accurate dates and times to help attendees find your event at the right moment.
        </p>
      </div>
    </div>
  )
}
