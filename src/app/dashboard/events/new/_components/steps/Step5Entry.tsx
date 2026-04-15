'use client'

import { Lock } from 'lucide-react'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD']

export default function Step5Entry({ formData, updateForm, errors }: StepProps) {
  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

  const setFree = () => {
    updateForm('is_free', true)
    // Don't force-reset rsvp_required — let user choose
  }

  const setPaid = () => {
    updateForm('is_free', false)
    // Paid events ALWAYS require registration
    updateForm('rsvp_required', true)
  }

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Entry & Registration</h3>

      {/* Free / Paid Toggle */}
      <div>
        <label className={labelCls}>Ticket Type</label>
        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
          <button
            type="button"
            onClick={setFree}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              formData.is_free
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            🎁 Free
          </button>
          <button
            type="button"
            onClick={setPaid}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
              !formData.is_free
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            💳 Paid
          </button>
        </div>
      </div>

      {/* Paid Event Fields */}
      {!formData.is_free && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Price *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => updateForm('price', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className={inputCls}
              />
              {errors.price && <p className={errorCls}>{errors.price}</p>}
            </div>
            <div>
              <label className={labelCls}>Currency *</label>
              <select
                value={formData.currency}
                onChange={(e) => updateForm('currency', e.target.value)}
                className={inputCls}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Payment Link *</label>
            <input
              type="url"
              value={formData.payment_link}
              onChange={(e) => updateForm('payment_link', e.target.value)}
              placeholder="e.g., https://pay.flutterwave.com/..."
              className={inputCls}
            />
            {errors.payment_link && <p className={errorCls}>{errors.payment_link}</p>}
            <p className="text-xs text-gray-500 mt-1">Link to Flutterwave, Paystack, or any payment platform</p>
          </div>
        </div>
      )}

      {/* Registration / RSVP */}
      <div>
        <label className={labelCls}>Registration</label>

        {!formData.is_free ? (
          /* Paid: registration is mandatory */
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Registration is required for paid events — attendees must register to complete payment.
            </p>
          </div>
        ) : (
          /* Free: optional toggle */
          <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
            <button
              type="button"
              onClick={() => updateForm('rsvp_required', false)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                !formData.rsvp_required
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              No Registration
            </button>
            <button
              type="button"
              onClick={() => updateForm('rsvp_required', true)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                formData.rsvp_required
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              RSVP Required
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          {!formData.is_free
            ? 'Attendees click "Get Tickets", fill the form, then complete payment via your link.'
            : formData.rsvp_required
            ? 'Attendees must fill a short form to confirm their attendance.'
            : 'Anyone can mark themselves as attending with one tap — no form needed.'}
        </p>
      </div>

      {/* Capacity — shown when RSVP or Paid */}
      {(formData.rsvp_required || !formData.is_free) && (
        <div>
          <label className={labelCls}>
            Attendee Capacity <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => updateForm('capacity', e.target.value)}
            placeholder="e.g., 200"
            min="1"
            className={inputCls}
          />
          {errors.capacity && <p className={errorCls}>{errors.capacity}</p>}
          <p className="text-xs text-gray-500 mt-1">Leave blank for unlimited attendees.</p>
        </div>
      )}
    </div>
  )
}
