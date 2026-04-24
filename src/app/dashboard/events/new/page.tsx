export const dynamic = 'force-dynamic'

import EventFormStepper from './_components/EventFormStepper'
import BackButton from '@/components/ui/BackButton'

export default function NewEventPage() {
  return (
    <>
      <BackButton />
      <EventFormStepper isEditMode={false} />
    </>
  )
}
