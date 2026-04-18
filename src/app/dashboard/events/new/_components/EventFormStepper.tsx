'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import StepperProgressBar from './StepperProgressBar'
import Step1Basics from './steps/Step1Basics'
import Step2DateTime from './steps/Step2DateTime'
import Step3Location from './steps/Step3Location'
import Step4Media from './steps/Step4Media'
import Step5Entry from './steps/Step5Entry'
import Step6Review from './steps/Step6Review'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/database'
import { getVisibleCategories, type CategoryRow } from '@/app/actions/categories'

const TOTAL_STEPS = 6
const AUTO_SAVE_DELAY = 2000 // 2 seconds debounce
const DRAFT_KEY = 'gospello_event_draft'

type RegistrationType = 'free_no_registration' | 'free_registration' | 'paid'

interface FormState {
  title: string
  description: string
  category: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  is_online: boolean
  online_platform: string
  online_link: string
  location_name: string
  address: string
  city: string
  state: string
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
}

const INITIAL_FORM_STATE: FormState = {
  title: '',
  description: '',
  category: 'worship',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  is_online: false,
  online_platform: '',
  online_link: '',
  location_name: '',
  address: '',
  city: '',
  state: '',
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
}

interface Props {
  isEditMode?: boolean
  initialEvent?: Partial<Event>
}

export default function EventFormStepper({ isEditMode = false, initialEvent }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const submittedRef = useRef(false)

  const supabase = createClient()

  // Load initial data or draft
  useEffect(() => {
    if (isEditMode && initialEvent) {
      // Load from database (edit mode)
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        category: initialEvent.category || 'worship',
        start_date: initialEvent.start_date?.split('T')[0] || '',
        start_time: initialEvent.start_date?.split('T')[1]?.substring(0, 5) || '',
        end_date: initialEvent.end_date?.split('T')[0] || '',
        end_time: initialEvent.end_date?.split('T')[1]?.substring(0, 5) || '',
        is_online: initialEvent.is_online || false,
        online_platform: initialEvent.online_platform || '',
        online_link: initialEvent.online_link || '',
        location_name: initialEvent.location_name || '',
        address: initialEvent.address || '',
        city: initialEvent.city || '',
        state: initialEvent.state || '',
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
      })
    } else {
      // Load from localStorage (creation mode)
      const savedDraft = localStorage.getItem(DRAFT_KEY)
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          setFormData(parsed)
        } catch (e) {
          console.error('Failed to parse saved draft:', e)
        }
      }
    }
  }, [isEditMode, initialEvent])

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
        if (!formData.start_date) newErrors.start_date = 'Start date is required'
        if (!formData.start_time) newErrors.start_time = 'Start time is required'
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
      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        start_date: `${formData.start_date}T${formData.start_time}:00`,
        end_date: formData.end_date
          ? `${formData.end_date}T${formData.end_time || '00:00'}:00`
          : null,
        is_online: formData.is_online,
        online_platform: formData.is_online ? formData.online_platform : null,
        online_link: formData.is_online ? formData.online_link : null,
        // Use empty strings for online events — avoids NOT NULL constraint violations
        location_name: !formData.is_online ? formData.location_name : 'Online Event',
        address: !formData.is_online ? formData.address : null,
        city: !formData.is_online ? formData.city : 'Online',
        state: !formData.is_online ? formData.state : 'Online',
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

      // Redirect to dashboard
      router.push('/dashboard/events')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update your event details' : 'Fill in your event information step by step'}
          </p>
        </div>

        {/* Progress Bar */}
        <StepperProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Auto-save indicator */}
        {!isEditMode && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">{getFormattedLastSaved() || 'Ready to save'}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="mt-8">
          {renderStep()}
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 sm:gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Back
          </button>

          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Publishing...' : isEditMode ? 'Update Event' : 'Publish Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
