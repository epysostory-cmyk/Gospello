import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailReminder } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'

// Runs every hour via Vercel cron (vercel.json).
// Sends reminders to registrants whose event starts in the next 23–24 hours.
// The 1-hour window matches the cron frequency so each event is hit exactly once.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // Events starting 23–24 hours from now
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const windowEnd   = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: events, error: eventsErr } = await admin
    .from('events')
    .select('id, title, slug, start_date, location_name, address, city, state')
    .eq('status', 'approved')
    .gte('start_date', windowStart.toISOString())
    .lte('start_date', windowEnd.toISOString())

  if (eventsErr) {
    console.error('[reminders] Failed to fetch events:', eventsErr)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No events in window' })
  }

  let sent = 0
  let failed = 0

  for (const event of events) {
    // Only remind confirmed registrants
    const { data: registrations } = await admin
      .from('registrations')
      .select('id, full_name, email, ticket_number')
      .eq('event_id', event.id)
      .or('registration_type.eq.free_registration,and(registration_type.eq.paid,paid_confirmed.eq.true)')

    if (!registrations || registrations.length === 0) continue

    const eventDate     = formatDate(event.start_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const eventTime     = formatTime(event.start_date)
    const eventLocation = event.location_name ?? event.city ?? 'See event page'
    const eventAddress  = [event.address, event.city, event.state].filter(Boolean).join(', ') || eventLocation

    for (const reg of registrations) {
      const { subject, html } = emailReminder({
        attendeeName:  reg.full_name,
        eventTitle:    event.title,
        eventDate,
        eventTime,
        eventLocation,
        eventAddress,
        ticketNumber:  reg.ticket_number,
        eventSlug:     event.slug,
      })

      const ok = await sendEmail({ to: reg.email, subject, html })
      if (ok) sent++
      else {
        console.error('[reminders] Failed to send to', reg.email, 'event', event.id)
        failed++
      }
    }
  }

  console.log(`[reminders] Done — sent: ${sent}, failed: ${failed}`)
  return NextResponse.json({ sent, failed })
}
