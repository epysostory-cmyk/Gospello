export const dynamic = 'force-dynamic'

import EventFormStepper from './_components/EventFormStepper'
import BackButton from '@/components/ui/BackButton'

interface Props {
  searchParams: Promise<{ from_church?: string; church_name?: string; city?: string; state?: string; address?: string; location_name?: string }>
}

export default async function NewEventPage({ searchParams }: Props) {
  const sp = await searchParams
  const prefillLocation = sp.from_church ? {
    city: sp.city ?? '',
    state: sp.state ?? '',
    address: sp.address ?? '',
    location_name: sp.location_name ?? '',
  } : undefined

  return (
    <>
      <BackButton />
      <EventFormStepper isEditMode={false} prefillLocation={prefillLocation} />
    </>
  )
}
