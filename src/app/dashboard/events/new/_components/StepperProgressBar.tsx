'use client'

interface Props {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = ['Basics', 'Date & Time', 'Location', 'Flyer', 'Tickets', 'Review']

export default function StepperProgressBar({ currentStep, totalSteps }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 font-medium">
          Step {currentStep} of {totalSteps} &mdash; <span className="text-gray-700 font-semibold">{STEP_LABELS[currentStep - 1]}</span>
        </p>
        <p className="text-xs text-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</p>
      </div>
      <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-0.5 bg-gray-900 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}
