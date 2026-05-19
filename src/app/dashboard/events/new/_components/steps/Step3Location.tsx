'use client'

import { NIGERIAN_STATES, COUNTRY_LIST } from '@/lib/utils'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

const ONLINE_PLATFORMS = ['Zoom', 'YouTube Live', 'Google Meet', 'Facebook Live', 'Instagram Live', 'TikTok Live', 'WhatsApp', 'Telegram', 'Other']
const inp = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 bg-white transition-colors'

export default function Step3Location({ formData, updateForm, errors }: StepProps) {
  const switchToPhysical = () => {
    updateForm('is_online', false)
    updateForm('online_platform', '')
    updateForm('online_link', '')
  }
  const switchToOnline = () => {
    updateForm('is_online', true)
    updateForm('location_name', '')
    updateForm('address', '')
    updateForm('city', '')
    updateForm('state', '')
    updateForm('country', 'Nigeria')
  }
  const isNigeria = (formData.country || 'Nigeria') === 'Nigeria'

  return (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">Where is this event?</label>
        <div className="flex gap-2">
          <button type="button" onClick={switchToPhysical}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              !formData.is_online ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Physical Location
          </button>
          <button type="button" onClick={switchToOnline}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              formData.is_online ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            Online Event
          </button>
        </div>
      </div>

      {!formData.is_online && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Country <span className="text-red-500">*</span></label>
            <select value={formData.country || 'Nigeria'}
              onChange={e => { updateForm('country', e.target.value); updateForm('state', '') }}
              className={inp}>
              {COUNTRY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Venue name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.location_name}
              onChange={e => updateForm('location_name', e.target.value)}
              placeholder="e.g. Dominion City, Faith Auditorium"
              className={inp} />
            {errors.location_name && <p className="text-red-500 text-xs mt-1">{errors.location_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Street address <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={formData.address}
              onChange={e => updateForm('address', e.target.value)}
              placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
              className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">City <span className="text-red-500">*</span></label>
              <input type="text" value={formData.city}
                onChange={e => updateForm('city', e.target.value)}
                placeholder={isNigeria ? 'e.g. Lagos' : 'e.g. London'}
                className={inp} />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                {isNigeria ? 'State' : 'Region'} <span className="text-red-500">*</span>
              </label>
              {isNigeria ? (
                <select value={formData.state}
                  onChange={e => updateForm('state', e.target.value)}
                  className={inp}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              ) : (
                <input type="text" value={formData.state}
                  onChange={e => updateForm('state', e.target.value)}
                  placeholder="e.g. England, Texas"
                  className={inp} />
              )}
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
          </div>
        </div>
      )}

      {formData.is_online && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Platform <span className="text-gray-400 font-normal">(optional)</span></label>
            <select value={formData.online_platform}
              onChange={e => updateForm('online_platform', e.target.value)}
              className={inp}>
              <option value="">Select platform</option>
              {ONLINE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Join link <span className="text-red-500">*</span></label>
            <input type="url" value={formData.online_link}
              onChange={e => updateForm('online_link', e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={inp} />
            {errors.online_link && <p className="text-red-500 text-xs mt-1">{errors.online_link}</p>}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          Livestream link <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input type="url" value={formData.livestream_url}
          onChange={e => updateForm('livestream_url', e.target.value)}
          placeholder="https://youtube.com/live/..."
          className={inp} />
        <p className="text-xs text-gray-400 mt-1">Add even if it&apos;s a physical event.</p>
      </div>
    </div>
  )
}
