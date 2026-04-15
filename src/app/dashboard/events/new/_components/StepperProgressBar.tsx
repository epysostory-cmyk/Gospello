'use client'

interface Props {
  currentStep: number
  totalSteps: number
}

export default function StepperProgressBar({ currentStep, totalSteps }: Props) {
  const stepLabels = [
    'Basics',
    'Date & Time',
    'Location',
    'Media',
    'Entry',
    'Review',
  ]

  return (
    <div className="space-y-3">
      {/* Step indicator text */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {stepLabels[currentStep - 1]}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-indigo-600 h-2 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i + 1 <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
