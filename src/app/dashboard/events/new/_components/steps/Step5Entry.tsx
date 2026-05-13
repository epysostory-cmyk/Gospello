'use client'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD']
type RegistrationType = 'free_no_registration' | 'free_registration' | 'paid'

const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors'

const OPTIONS: { value: RegistrationType; label: string; desc: string }[] = [
  {
    value: 'free_no_registration',
    label: 'Free — No registration needed',
    desc: 'Anyone can mark themselves attending with one tap. No form or ticket required.',
  },
  {
    value: 'free_registration',
    label: 'Free — But register to attend',
    desc: 'Free event. Attendees fill a short form and receive a ticket by email.',
  },
  {
    value: 'paid',
    label: 'Paid event',
    desc: 'Attendees register and pay via your payment link. Ticket sent after payment.',
  },
]

export default function Step5Entry({ formData, updateForm, errors }: StepProps) {
  const current: RegistrationType = formData.registration_type ?? 'free_no_registration'

  const selectType = (type: RegistrationType) => {
    updateForm('registration_type', type)
    if (type === 'free_no_registration') {
      updateForm('is_free', true); updateForm('rsvp_required', false)
    } else if (type === 'free_registration') {
      updateForm('is_free', true); updateForm('rsvp_required', true)
    } else {
      updateForm('is_free', false); updateForm('rsvp_required', true)
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">How will people attend this event?</label>
        <div className="space-y-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectType(opt.value)}
              className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-colors ${
                current === opt.value
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  current === opt.value ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {current === opt.value && <span className="w-2 h-2 rounded-full bg-gray-900" />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {current === 'paid' && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Ticket price <span className="text-red-500">*</span></label>
              <input type="number" value={formData.price}
                onChange={e => updateForm('price', e.target.value)}
                placeholder="0" min="0" step="0.01"
                className={inp} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Currency <span className="text-red-500">*</span></label>
              <select value={formData.currency}
                onChange={e => updateForm('currency', e.target.value)}
                className={inp}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Payment link <span className="text-red-500">*</span></label>
            <input type="url" value={formData.payment_link}
              onChange={e => updateForm('payment_link', e.target.value)}
              placeholder="https://paystack.com/pay/..."
              className={inp} />
            {errors.payment_link && <p className="text-red-500 text-xs mt-1">{errors.payment_link}</p>}
            <p className="text-xs text-gray-400 mt-1">Flutterwave, Paystack, or any payment page link.</p>
          </div>
        </div>
      )}

      {(current === 'free_registration' || current === 'paid') && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Attendee limit <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="number" value={formData.capacity}
            onChange={e => updateForm('capacity', e.target.value)}
            placeholder="Leave blank for unlimited"
            min="1"
            className={inp} />
          {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
        </div>
      )}
    </div>
  )
}
