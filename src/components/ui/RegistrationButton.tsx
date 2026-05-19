/**
 * RegistrationButton — thin wrapper around AttendButton that accepts the
 * simplified prop shape used in the updated event detail page.
 */
import AttendButton from './AttendButton'
import type { RegistrationType } from '@/types/database'

interface EventProps {
  id: string
  slug?: string
  registration_type: RegistrationType
  price?: number | null
  payment_link?: string | null
  rsvp_required?: boolean
  is_free?: boolean
  title?: string
  is_online?: boolean
  start_date?: string
  end_date?: string | null
  location_name?: string | null
  city?: string | null
  description?: string | null
}

interface Props {
  event: EventProps
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  isOrganizer?: boolean
  initialRegistered?: boolean
}

export default function RegistrationButton({
  event,
  userId,
  userName,
  userEmail,
  isOrganizer = false,
  initialRegistered = false,
}: Props) {
  const location = event.is_online
    ? 'Online Event'
    : [event.location_name, event.city].filter(Boolean).join(', ') || ''

  return (
    <AttendButton
      eventId={event.id}
      eventTitle={event.title ?? ''}
      isFree={event.is_free ?? event.registration_type !== 'paid'}
      rsvpRequired={event.rsvp_required ?? event.registration_type === 'free_registration'}
      registrationType={event.registration_type}
      paymentLink={event.payment_link}
      initialAttended={initialRegistered}
      serverUserId={userId ?? null}
      serverUserName={userName ?? null}
      serverUserEmail={userEmail ?? null}
      isOrganizer={isOrganizer}
      isOnline={event.is_online}
      eventSlug={event.slug}
      eventStartDate={event.start_date}
      eventEndDate={event.end_date}
      eventLocation={location}
      eventDescription={event.description}
    />
  )
}
