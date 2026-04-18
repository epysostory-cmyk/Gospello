'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateTicketPdf } from '@/lib/ticket-pdf'
import { sendEmail, emailTicket, emailConfirmCode } from '@/lib/email'
import { formatDate } from '@/lib/utils'
import type { RegistrationType } from '@/types/database'

interface RegisterResult {
  success: boolean
  error?: string
  alreadyRegistered?: boolean
  registrationId?: string
  /** Base64-encoded PDF — present for free_registration type only (after code confirmed) */
  ticketPdfBase64?: string
  ticketNumber?: number
  /** True when email confirmation is required before ticket is issued */
  needsEmailConfirmation?: boolean
}

/**
 * Creates a registration for rsvp (free_registration) or paid events.
 * Also inserts an attendance record so the count stays accurate.
 * For free_registration: generates + emails the PDF ticket immediately.
 * For paid: inserts the record but defers the ticket until confirmPayment().
 */
export async function registerForEvent(
  eventId: string,
  fullName: string,
  email: string,
  registrationType: RegistrationType,
  phone?: string,
): Promise<RegisterResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    // ── Guard: already registered? ──────────────────────────
    const { data: existing } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (existing) return { success: false, alreadyRegistered: true }

    // ── Assign next sequential ticket number for this event ──
    const { data: maxRow } = await admin
      .from('registrations')
      .select('ticket_number')
      .eq('event_id', eventId)
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const ticketNumber = (maxRow?.ticket_number ?? 0) + 1

    // ── Insert registration ──────────────────────────────────
    const { data: reg, error: regErr } = await admin
      .from('registrations')
      .insert({
        event_id: eventId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        ticket_number: ticketNumber,
        registration_type: registrationType,
        paid_confirmed: false,
      })
      .select()
      .single()

    if (regErr) {
      if (regErr.code === '23505') return { success: false, alreadyRegistered: true }
      return { success: false, error: regErr.message }
    }

    // ── Also insert attendance (drives count) ────────────────
    const { error: attErr } = await admin.from('attendances').insert({
      event_id: eventId,
      user_id: user?.id ?? null,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
    })
    // Duplicate attendance is fine (23505); any other error is logged but doesn't block the ticket
    if (attErr && attErr.code !== '23505') {
      console.error('registerForEvent attendance insert error:', attErr.message)
    }

    // ── Fetch event details for PDF + email ──────────────────
    const { data: event } = await admin
      .from('events')
      .select('title, start_date, location_name, city, state, is_online')
      .eq('id', eventId)
      .single()

    const eventTitle = event?.title ?? 'Event'
    const eventDate = event?.start_date
      ? formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBD'
    const eventLocation = event?.is_online
      ? 'Online Event'
      : [event?.location_name, event?.city].filter(Boolean).join(', ') || 'TBD'

    // ── For free_registration: generate ticket immediately + email it ──
    if (registrationType === 'free_registration') {
      const pdfBytes = await generateTicketPdf({
        eventTitle,
        eventDate,
        eventLocation,
        attendeeName: fullName.trim(),
        attendeeEmail: email.trim().toLowerCase(),
        ticketNumber,
        registrationType,
      })

      const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

      const { subject, html } = emailTicket({
        eventTitle,
        attendeeName: fullName.trim(),
        ticketNumber,
        eventDate,
        eventLocation,
        isPaid: false,
      })

      // Best-effort email — don't block ticket download if email fails
      void sendEmail({
        to: email.trim().toLowerCase(),
        subject,
        html,
        attachments: [{ filename: `ticket-${String(ticketNumber).padStart(4, '0')}.pdf`, content: pdfBase64 }],
      })

      return { success: true, registrationId: reg.id, ticketPdfBase64: pdfBase64, ticketNumber }
    }

    // ── For paid: return id only, ticket deferred to payment confirmation ──
    return { success: true, registrationId: reg.id, ticketNumber }
  } catch (err) {
    console.error('registerForEvent error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

interface ConfirmResult {
  success: boolean
  error?: string
  ticketPdfBase64?: string
  ticketNumber?: number
}

/**
 * Called after a paid attendee confirms they've completed payment.
 * Sets paid_confirmed = true, generates the PDF ticket, and emails it.
 */
export async function confirmPayment(registrationId: string, registrantEmail: string): Promise<ConfirmResult> {
  try {
    const admin = createAdminClient()

    // ── Fetch registration ───────────────────────────────────
    const { data: reg, error: fetchErr } = await admin
      .from('registrations')
      .select('id, event_id, full_name, email, ticket_number, paid_confirmed')
      .eq('id', registrationId)
      .single()

    if (fetchErr || !reg) return { success: false, error: 'Registration not found.' }

    // ── Ownership check — caller must be the registrant ──────
    if (reg.email.toLowerCase() !== registrantEmail.trim().toLowerCase()) {
      return { success: false, error: 'Unauthorized.' }
    }

    // ── Mark as confirmed (idempotent) ───────────────────────
    if (!reg.paid_confirmed) {
      await admin
        .from('registrations')
        .update({ paid_confirmed: true })
        .eq('id', registrationId)
    }

    // ── Fetch event details ──────────────────────────────────
    const { data: event } = await admin
      .from('events')
      .select('title, start_date, location_name, city, state, is_online')
      .eq('id', reg.event_id)
      .single()

    const eventTitle = event?.title ?? 'Event'
    const eventDate = event?.start_date
      ? formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBD'
    const eventLocation = event?.is_online
      ? 'Online Event'
      : [event?.location_name, event?.city].filter(Boolean).join(', ') || 'TBD'

    // ── Generate PDF ─────────────────────────────────────────
    const pdfBytes = await generateTicketPdf({
      eventTitle,
      eventDate,
      eventLocation,
      attendeeName: reg.full_name,
      attendeeEmail: reg.email,
      ticketNumber: reg.ticket_number,
      registrationType: 'paid',
    })

    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    // ── Send email ───────────────────────────────────────────
    const { subject, html } = emailTicket({
      eventTitle,
      attendeeName: reg.full_name,
      ticketNumber: reg.ticket_number,
      eventDate,
      eventLocation,
      isPaid: true,
    })

    await sendEmail({
      to: reg.email,
      subject,
      html,
      attachments: [{ filename: `ticket-${String(reg.ticket_number).padStart(4, '0')}.pdf`, content: pdfBase64 }],
    })

    return { success: true, ticketPdfBase64: pdfBase64, ticketNumber: reg.ticket_number }
  } catch (err) {
    console.error('confirmPayment error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

/**
 * Regenerates a ticket PDF for an existing registration.
 * Used when the attendee refreshes the page and needs their ticket again.
 */
export async function regenerateTicket(registrationId: string, registrantEmail: string): Promise<ConfirmResult> {
  try {
    const admin = createAdminClient()

    const { data: reg, error: fetchErr } = await admin
      .from('registrations')
      .select('id, event_id, full_name, email, ticket_number, registration_type, paid_confirmed')
      .eq('id', registrationId)
      .single()

    if (fetchErr || !reg) return { success: false, error: 'Registration not found.' }

    // ── Ownership check ──────────────────────────────────────
    if (reg.email.toLowerCase() !== registrantEmail.trim().toLowerCase()) {
      return { success: false, error: 'Unauthorized.' }
    }

    // For paid events, only issue ticket if payment was confirmed
    if (reg.registration_type === 'paid' && !reg.paid_confirmed) {
      return { success: false, error: 'Payment not yet confirmed.' }
    }

    const { data: event } = await admin
      .from('events')
      .select('title, start_date, location_name, city, state, is_online')
      .eq('id', reg.event_id)
      .single()

    const eventTitle = event?.title ?? 'Event'
    const eventDate = event?.start_date
      ? formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBD'
    const eventLocation = event?.is_online
      ? 'Online Event'
      : [event?.location_name, event?.city].filter(Boolean).join(', ') || 'TBD'

    const pdfBytes = await generateTicketPdf({
      eventTitle,
      eventDate,
      eventLocation,
      attendeeName: reg.full_name,
      attendeeEmail: reg.email,
      ticketNumber: reg.ticket_number,
      registrationType: reg.registration_type ?? 'free_registration',
    })

    return {
      success: true,
      ticketPdfBase64: Buffer.from(pdfBytes).toString('base64'),
      ticketNumber: reg.ticket_number,
    }
  } catch (err) {
    console.error('regenerateTicket error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

interface ConfirmCodeResult {
  success: boolean
  error?: string
  ticketPdfBase64?: string
  ticketNumber?: number
}

/**
 * Called after a free_registration attendee enters their 6-digit email code.
 * Validates the code, generates + emails the PDF ticket.
 */
export async function confirmEmailCode(
  registrationId: string,
  code: string,
  registrantEmail: string,
): Promise<ConfirmCodeResult> {
  try {
    const admin = createAdminClient()

    const { data: reg, error: fetchErr } = await admin
      .from('registrations')
      .select('id, event_id, full_name, email, ticket_number, confirmation_code, code_expires_at, email_confirmed')
      .eq('id', registrationId)
      .single()

    if (fetchErr || !reg) return { success: false, error: 'Registration not found.' }

    // ── Ownership check ──────────────────────────────────────
    if (reg.email.toLowerCase() !== registrantEmail.trim().toLowerCase()) {
      return { success: false, error: 'Unauthorized.' }
    }

    if (reg.email_confirmed) {
      // Already confirmed — idempotent: re-generate the ticket
    } else {
      if (!reg.confirmation_code || reg.confirmation_code !== code.trim()) {
        return { success: false, error: 'Incorrect code. Please check your email and try again.' }
      }
      if (reg.code_expires_at && new Date(reg.code_expires_at) < new Date()) {
        return { success: false, error: 'This code has expired. Please re-register to get a new code.' }
      }
    }

    // Mark email confirmed
    await admin
      .from('registrations')
      .update({ email_confirmed: true, confirmation_code: null })
      .eq('id', registrationId)

    // Fetch event details
    const { data: event } = await admin
      .from('events')
      .select('title, start_date, location_name, city, state, is_online')
      .eq('id', reg.event_id)
      .single()

    const eventTitle = event?.title ?? 'Event'
    const eventDate = event?.start_date
      ? formatDate(event.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'TBD'
    const eventLocation = event?.is_online
      ? 'Online Event'
      : [event?.location_name, event?.city].filter(Boolean).join(', ') || 'TBD'

    const pdfBytes = await generateTicketPdf({
      eventTitle,
      eventDate,
      eventLocation,
      attendeeName: reg.full_name,
      attendeeEmail: reg.email,
      ticketNumber: reg.ticket_number,
      registrationType: 'free_registration',
    })

    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    const { subject, html } = emailTicket({
      eventTitle,
      attendeeName: reg.full_name,
      ticketNumber: reg.ticket_number,
      eventDate,
      eventLocation,
      isPaid: false,
    })

    await sendEmail({
      to: reg.email,
      subject,
      html,
      attachments: [{ filename: `ticket-${String(reg.ticket_number).padStart(4, '0')}.pdf`, content: pdfBase64 }],
    })

    return { success: true, ticketPdfBase64: pdfBase64, ticketNumber: reg.ticket_number }
  } catch (err) {
    console.error('confirmEmailCode error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
