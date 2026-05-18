'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Clock, Bell, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import StepperProgressBar from './StepperProgressBar'
import Step1Basics from './steps/Step1Basics'
import Step2DateTime from './steps/Step2DateTime'
import Step3Location from './steps/Step3Location'
import Step4Media from './steps/Step4Media'
import Step5Entry from './steps/Step5Entry'
import Step6Review from './steps/Step6Review'
import { createClient } from '@/lib/supabase/client'
import type { Event, DaySchedule } from '@/types/database'
import { getVisibleCategories, type CategoryRow } from '@/app/actions/categories'

const TOTAL_STEPS = 6
const AUTO_SAVE_DELAY = 2000 // 2 seconds debounce
const DRAFT_KEY = 'gospello_event_draft'

type RegistrationType = 'free_no_registration' | 'free_registration' | 'paid'

interface FormState {
  title: string
  description: string
  category: string
  event_type: 'single' | 'multi'
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  daily_schedule: DaySchedule[] | null
  is_online: boolean
  online_platform: string
  online_link: string
  location_name: string
  address: string
  city: string
  state: string
  country: string
  registration_type: RegistrationType
  is_free: boolean
  price: string
  currency: string
  payment_link: string
  rsvp_required: boolean
  capacity: string
  tags: string[]
  banner_url: string
  visibility: 'draft' | 'public'
  speakers: string
  parking_available: boolean
  child_friendly: boolean
  notes: string
  shuttle_available: boolean
  wheelchair_accessible: boolean
  food_provided: boolean
  accommodation_available: boolean
  dress_code: string
  no_recording: boolean
  gender_restriction: string
  timezone: string
  livestream_url: string
}

const INITIAL_FORM_STATE: FormState = {
  title: '',
  description: '',
  category: 'worship',
  event_type: 'single',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  daily_schedule: null,
  is_online: false,
  online_platform: '',
  online_link: '',
  location_name: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  registration_type: 'free_no_registration',
  is_free: true,
  price: '',
  currency: 'NGN',
  payment_link: '',
  rsvp_required: false,
  capacity: '',
  tags: [],
  banner_url: '',
  visibility: 'public',
  speakers: '',
  parking_available: false,
  child_friendly: false,
  notes: '',
  shuttle_available: false,
  wheelchair_accessible: false,
  food_provided: false,
  accommodation_available: false,
  dress_code: '',
  no_recording: false,
  gender_restriction: '',
  timezone: 'Africa/Lagos',
  livestream_url: '',
}

interface Props {
  isEditMode?: boolean
  initialEvent?: Partial<Event>
  eventStatus?: string
  prefillLocation?: { city: string; state: string; address: string; location_name: string }
}

export default function EventFormStepper({ isEditMode = false, initialEvent, eventStatus, prefillLocation }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const submittedRef = useRef(false)

  const supabase = createClient()

  // Load initial data or draft
  useEffect(() => {
    if (isEditMode && initialEvent) {
      // Load from database (edit mode)
      const hasMultiDaySchedule = !!(initialEvent as any).daily_schedule?.length
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        category: initialEvent.category || 'worship',
        event_type: hasMultiDaySchedule ? 'multi' : 'single',
        start_date: initialEvent.start_date?.split('T')[0] || '',
        start_time: hasMultiDaySchedule ? '' : (initialEvent.start_date?.split('T')[1]?.substring(0, 5) || ''),
        end_date: initialEvent.end_date?.split('T')[0] || '',
        end_time: hasMultiDaySchedule ? '' : (initialEvent.end_date?.split('T')[1]?.substring(0, 5) || ''),
        daily_schedule: (initialEvent as any).daily_schedule || null,
        is_online: initialEvent.is_online || false,
        online_platform: initialEvent.online_platform || '',
        online_link: initialEvent.online_link || '',
        location_name: initialEvent.location_name || '',
        address: initialEvent.address || '',
        city: initialEvent.city || '',
        state: initialEvent.state || '',
        country: initialEvent.country || 'Nigeria',
        registration_type: (initialEvent as any).registration_type || (
          !initialEvent.is_free ? 'paid'
          : initialEvent.rsvp_required ? 'free_registration'
          : 'free_no_registration'
        ),
        is_free: initialEvent.is_free ?? true,
        price: initialEvent.price?.toString() || '',
        currency: initialEvent.currency || 'NGN',
        payment_link: initialEvent.payment_link || '',
        rsvp_required: initialEvent.rsvp_required || false,
        capacity: initialEvent.capacity?.toString() || '',
        tags: initialEvent.tags || [],
        banner_url: initialEvent.banner_url || '',
        visibility: (initialEvent.visibility as 'draft' | 'public') || 'public',
        speakers: initialEvent.speakers || '',
        parking_available: initialEvent.parking_available || false,
        child_friendly: initialEvent.child_friendly || false,
        notes: initialEvent.notes || '',
        shuttle_available: (initialEvent as any).shuttle_available || false,
        wheelchair_accessible: (initialEvent as any).wheelchair_accessible || false,
        food_provided: (initialEvent as any).food_provided || false,
        accommodation_available: (initialEvent as any).accommodation_available || false,
        dress_code: (initialEvent as any).dress_code || '',
        no_recording: (initialEvent as any).no_recording || false,
        gender_restriction: (initialEvent as any).gender_restriction || '',
        timezone: (initialEvent as any).timezone || 'Africa/Lagos',
        livestream_url: (initialEvent as any).livestream_url || '',
      })
    } else {
      // Load from localStorage (creation mode), then overlay prefill if present
      const savedDraft = localStorage.getItem(DRAFT_KEY)
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          setFormData({ ...parsed, visibility: 'public' })
        } catch (e) {
          console.error('Failed to parse saved draft:', e)
        }
      } else if (prefillLocation) {
        setFormData(prev => ({
          ...prev,
          city: prefillLocation.city,
          state: prefillLocation.state,
          address: prefillLocation.address,
          location_name: prefillLocation.location_name,
        }))
      }
    }
  }, [isEditMode, initialEvent]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load categories from DB
  useEffect(() => {
    getVisibleCategories().then(setCategories)
  }, [])

  // Fix 5: Warn user before leaving with unsaved form data
  useEffect(() => {
    if (isEditMode) return
    const hasData = formData.title.trim() !== '' || formData.description.trim() !== ''
    if (!hasData) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formData.title, formData.description, isEditMode])

  // Auto-save to localStorage (debounced, no infinite loop)
  useEffect(() => {
    if (isEditMode) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      setLastSaved(new Date())
    }, AUTO_SAVE_DELAY)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [formData, isEditMode])

  const updateForm = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required'
        if (!formData.description.trim()) newErrors.description = 'Description is required'
        if (!formData.category) newErrors.category = 'Category is required'
        break
      case 2:
        if (formData.event_type === 'multi') {
          if (!formData.start_date) newErrors.start_date = 'Start date is required'
          if (!formData.end_date)   newErrors.end_date   = 'End date is required'
          else if (formData.end_date <= formData.start_date)
            newErrors.end_date = 'End date must be after start date'
          const sched = formData.daily_schedule || []
          if (sched.length > 14)
            newErrors.end_date = 'Event duration cannot exceed 14 days'
          else if (sched.length === 0)
            newErrors.start_date = 'Please set a valid date range'
        } else {
          if (!formData.start_date) newErrors.start_date = 'Start date is required'
          if (!formData.start_time) newErrors.start_time = 'Start time is required'
        }
        break
      case 3:
        if (formData.is_online) {
          if (!formData.online_link.trim()) newErrors.online_link = 'Join link is required for online events'
        } else {
          if (!formData.location_name.trim()) newErrors.location_name = 'Location name is required'
          if (!formData.city.trim()) newErrors.city = 'City is required'
          if (!formData.state.trim()) newErrors.state = 'State is required'
        }
        break
      case 4:
        if (!formData.banner_url) newErrors.banner_url = 'Banner image is required'
        break
      case 5:
        if (!formData.is_free) {
          if (!formData.price) newErrors.price = 'Price is required'
          if (!formData.payment_link.trim()) newErrors.payment_link = 'Payment link is required'
        }
        // Fix 3: capacity is optional (blank = unlimited) — only validate if a value is entered
        if (formData.capacity && parseInt(formData.capacity) < 1) {
          newErrors.capacity = 'Capacity must be at least 1'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(TOTAL_STEPS)) return

    setIsSubmitting(true)

    try {
      // Get UTC offset string (e.g. "+01:00") from the selected timezone
      function tzOffset(tz: string, dateStr: string): string {
        try {
          const parts = new Intl.DateTimeFormat('en', {
            timeZone: tz, timeZoneName: 'shortOffset',
          }).formatToParts(new Date(dateStr + 'T12:00:00'))
          const gmt = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT'
          const match = gmt.match(/GMT([+-]\d{1,2}):?(\d{2})?/)
          if (!match) return 'Z'
          const sign = match[1].startsWith('-') ? '-' : '+'
          const hrs  = Math.abs(parseInt(match[1])).toString().padStart(2, '0')
          const mins = (match[2] ?? '00').padStart(2, '0')
          return `${sign}${hrs}:${mins}`
        } catch { return 'Z' }
      }

      const tz = formData.timezone || 'Africa/Lagos'

      // Compute start/end datetimes and daily_schedule
      let startDatetime: string
      let endDatetime: string | null
      let daily_schedule: DaySchedule[] | null = null

      if (formData.event_type === 'multi' && formData.daily_schedule?.length) {
        const sched: DaySchedule[] = formData.daily_schedule
        const first = sched[0]
        const last  = sched[sched.length - 1]
        const offset = tzOffset(tz, first.date)
        const firstTime = first.sessions?.find((s: {start_time: string|null}) => s.start_time)?.start_time ?? first.start_time ?? '00:00'
        const lastTime = last.sessions?.slice().reverse().find((s: {end_time: string|null}) => s.end_time)?.end_time ?? last.end_time ?? '23:59'
        startDatetime = `${first.date}T${firstTime}:00${offset}`
        endDatetime   = `${last.date}T${lastTime}:00${offset}`
        daily_schedule = sched
      } else {
        const offset = tzOffset(tz, formData.start_date)
        startDatetime = `${formData.start_date}T${formData.start_time}:00${offset}`
        endDatetime   = formData.end_time
          ? `${formData.start_date}T${formData.end_time}:00${offset}`
          : null
      }

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        start_date: startDatetime,
        end_date: endDatetime,
        daily_schedule,
        is_online: formData.is_online,
        online_platform: formData.is_online ? formData.online_platform : null,
        online_link: formData.is_online ? formData.online_link : null,
        // Use empty strings for online events — avoids NOT NULL constraint violations
        location_name: !formData.is_online ? formData.location_name : 'Online Event',
        address: !formData.is_online ? formData.address : null,
        city: !formData.is_online ? formData.city : 'Online',
        state: !formData.is_online ? formData.state : 'Online',
        country: !formData.is_online ? (formData.country || 'Nigeria') : 'Online',
        registration_type: formData.registration_type,
        is_free: formData.is_free,
        price: !formData.is_free ? parseFloat(formData.price) : null,
        currency: formData.currency,
        payment_link: !formData.is_free ? formData.payment_link : null,
        rsvp_required: formData.rsvp_required,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        tags: formData.tags,
        banner_url: formData.banner_url,
        gallery_urls: [],
        visibility: formData.visibility,
        status: 'pending',
        speakers: formData.speakers || null,
        parking_available: formData.parking_available,
        child_friendly: formData.child_friendly,
        notes: formData.notes || null,
        shuttle_available: formData.shuttle_available,
        wheelchair_accessible: formData.wheelchair_accessible,
        food_provided: formData.food_provided,
        accommodation_available: formData.accommodation_available,
        dress_code: formData.dress_code || null,
        no_recording: formData.no_recording,
        gender_restriction: formData.gender_restriction || null,
        timezone: formData.timezone || 'Africa/Lagos',
        livestream_url: formData.livestream_url || null,
      }

      if (isEditMode && initialEvent?.id) {
        // Update event
        const response = await fetch(`/api/events/${initialEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to update event (${response.status})`)
        }
      } else {
        // Create event
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to create event (${response.status})`)
        }
      }

      // Mark as submitted so beforeunload doesn't fire
      submittedRef.current = true

      // Clear localStorage on success
      localStorage.removeItem(DRAFT_KEY)

      // Show success screen instead of silent redirect
      setSubmitted(true)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFormattedLastSaved = () => {
    if (!lastSaved) return null
    const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000)
    if (minutes === 0) return 'Saving...'
    if (minutes === 1) return 'Last saved 1 minute ago'
    return `Last saved ${minutes} minutes ago`
  }

  const renderStep = () => {
    const props = { formData, updateForm, errors }

    switch (currentStep) {
      case 1: return <Step1Basics {...props} categories={categories} />
      case 2: return <Step2DateTime {...props} />
      case 3: return <Step3Location {...props} />
      case 4: return <Step4Media {...props} />
      case 5: return <Step5Entry {...props} />
      case 6: return <Step6Review {...props} goToStep={setCurrentStep} />
      default: return null
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
        <div className="w-full max-w-md">

          {/* Icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {isEditMode ? 'Changes saved' : 'Event submitted!'}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {isEditMode
                ? 'Your updates have been saved. The event is back in review.'
                : `Your event "${formData.title}" has been submitted and is now under review.`}
            </p>
          </div>

          {/* What happens next */}
          {!isEditMode && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">What happens next</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Our team reviews your event</p>
                    <p className="text-xs text-gray-500 mt-0.5">Usually within 24 hours. We check your details and approve it for the platform.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">You get notified</p>
                    <p className="text-xs text-gray-500 mt-0.5">We&apos;ll email you once it&apos;s approved — or if we need anything from you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Your event goes live</p>
                    <p className="text-xs text-gray-500 mt-0.5">It appears on Gospello for people to discover, save, and register.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            <Link
              href="/dashboard/events"
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
            >
              View my events
            </Link>
            {!isEditMode && (
              <Link
                href="/dashboard/events/new"
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
              >
                Post another event
              </Link>
            )}
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky top bar with progress */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-bold text-gray-900">
              {isEditMode ? 'Edit Event' : 'Post an Event'}
            </h1>
            {!isEditMode && (formData.title || formData.description) && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear everything and start over?')) {
                    localStorage.removeItem(DRAFT_KEY)
                    setFormData(INITIAL_FORM_STATE)
                    setCurrentStep(1)
                    setErrors({})
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Start over
              </button>
            )}
          </div>
          <StepperProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-36">
        {renderStep()}
        {errors.submit && (
          <div className="mt-6 p-4 border border-red-200 rounded-xl bg-red-50">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Bottom nav — floats above mobile nav bar on mobile, at bottom on desktop */}
      <div className="fixed left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 bottom-14 md:bottom-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="w-24 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Back
          </button>
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => {
                if (isEditMode && eventStatus === 'approved') {
                  if (!confirm('This will take your event offline and send it back for review. Proceed?')) return
                }
                handleSubmit()
              }}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Submit Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
