'use client'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD']

type RegistrationType = 'free_no_registration' | 'free_registration' | 'paid'

const REGISTRATION_OPTIONS: {
  value: RegistrationType
  emoji: string
  label: string
  sub: string
  accent: string
  activeBg: string
  activeBorder: string
  activeText: string
}[] = [
  {
    value: 'free_no_registration',
    emoji: '🎁',
    label: 'Free — No Registration',
    sub: 'Anyone taps once to mark themselves attending. No form needed.',
    accent: 'emerald',
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-800',
  },
  {
    value: 'free_registration',
    emoji: '✏️',
    label: 'Free — Register to Attend',
    sub: 'Free event but attendees fill a short form. Ticket emailed automatically.',
    accent: 'indigo',
    activeBg: 'bg-indigo-50',
    activeBorder: 'border-indigo-500',
    activeText: 'text-indigo-800',
  },
  {
    value: 'paid',
    emoji: '💳',
    label: 'Paid Event',
    sub: 'Attendees register then complete payment via your link. Ticket sent after confirmation.',
    accent: 'amber',
    activeBg: 'bg-amber-50',
    activeBorder: 'border-amber-500',
    activeText: 'text-amber-800',
  },
]

export default function Step5Entry({ formData, updateForm, errors }: StepProps) {
  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-2'
  const errorCls = 'text-red-600 text-xs mt-1'

  const currentType: RegistrationType = formData.registration_type ?? 'free_no_registration'

  const selectType = (type: RegistrationType) => {
    updateForm('registration_type', type)
    // Keep is_free + rsvp_required in sync for backward compatibility
    if (type === 'free_no_registration') {
      updateForm('is_free', true)
      updateForm('rsvp_required', false)
    } else if (type === 'free_registration') {
      updateForm('is_free', true)
      updateForm('rsvp_required', true)
    } else {
      updateForm('is_free', false)
      updateForm('rsvp_required', true)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Entry & Registration</h3>

      {/* Registration type — 3 options */}
      <div className="space-y-3">
        <label className={labelCls}>How will people attend?</label>
        {REGISTRATION_OPTIONS.map((opt) => {
          const active = currentType === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectType(opt.value)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                active
                  ? `${opt.activeBg} ${opt.activeBorder}`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Radio dot */}
              <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                active ? `border-${opt.accent}-500` : 'border-gray-300'
              }`}>
                {active && (
                  <span className={`w-2 h-2 rounded-full bg-${opt.accent}-500`} />
                )}
              </span>

              <span className="flex-1">
                <span className={`font-semibold text-sm ${active ? opt.activeText : 'text-gray-800'}`}>
                  {opt.emoji} {opt.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">{opt.sub}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Paid event fields */}
      {currentType === 'paid' && (
        <div className="space-y-4 pt-1">
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

      {/* Capacity — shown for registration or paid */}
      {(currentType === 'free_registration' || currentType === 'paid') && (
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
