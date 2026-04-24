/**
 * RegistrationButton — thin wrapper around AttendButton that accepts the
 * simplified prop shape used in the updated event detail page.
 */
import AttendButton from './AttendButton'
import type { RegistrationType } from '@/types/database'

interface EventProps {
  id: string
  registration_type: RegistrationType
  price?: number | null
  payment_link?: string | null
  rsvp_required?: boolean
  is_free?: boolean
  title?: string
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
    />
  )
}
