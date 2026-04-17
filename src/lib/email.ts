const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Gospello <noreply@gospello.com>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'

interface EmailAttachment {
  filename: string
  content: string
}
interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) return false
  try {
    const body: Record<string, unknown> = { from: FROM, to, subject, html }
    if (attachments?.length) body.attachments = attachments
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch { return false }
}

/* ─── Shared layout ─────────────────────────────────────────────────── */
function layout(headerBg: string, headerContent: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gospello</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <!-- Header -->
      <tr><td style="background:${headerBg};border-radius:8px 8px 0 0;padding:28px 40px;text-align:center;">
        ${headerContent}
      </td></tr>

      <!-- Body card -->
      <tr><td style="background:#FFFFFF;padding:40px;border-radius:0 0 8px 8px;">
        ${body}

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #E5E7EB;padding-top:24px;">
          <tr><td style="text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#9CA3AF;">© 2026 Gospello. All rights reserved.</p>
            <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;">Nigeria's home for gospel events</p>
            <p style="margin:0;font-size:12px;">
              <a href="${SITE}" style="color:#7C3AED;text-decoration:none;">gospello.com</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/privacy" style="color:#7C3AED;text-decoration:none;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <a href="${SITE}/terms" style="color:#7C3AED;text-decoration:none;">Terms</a>
            </p>
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}

function btn(url: string, text: string, bg = '#7C3AED'): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
    <tr><td style="background:${bg};border-radius:8px;">
      <a href="${url}" style="display:block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">${text}</a>
    </td></tr>
  </table>`
}

function logoHeader(color = '#FFFFFF'): string {
  return `<span style="font-size:26px;font-weight:900;color:${color};letter-spacing:-0.5px;">Gospello</span>
          <div style="width:40px;height:3px;background:${color === '#FFFFFF' ? 'rgba(255,255,255,0.4)' : '#7C3AED'};margin:10px auto 0;border-radius:2px;"></div>`
}

function benefitRow(icon: string, text: string): string {
  return `<tr>
    <td style="padding:6px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:28px;vertical-align:top;font-size:16px;">${icon}</td>
        <td style="font-size:14px;color:#374151;padding-left:8px;">${text}</td>
      </tr></table>
    </td>
  </tr>`
}

/* ─── EMAIL 1: Verify email ─────────────────────────────────────────── */
export function emailVerify(firstName: string, confirmUrl: string) {
  return {
    subject: `Confirm your email — Welcome to Gospello 🙏`,
    html: layout(
      '#7C3AED',
      logoHeader(),
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Welcome, ${firstName}! 🙏</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
        You're one step away from posting gospel events and connecting with believers across Nigeria.
        Click the button below to verify your email address.
      </p>
      ${btn(confirmUrl, 'Verify My Email')}
      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        This link expires in 24 hours.<br>
        If you didn't create an account, you can safely ignore this email.
      </p>
      <!-- Benefits -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;background:#F9FAFB;border-radius:8px;padding:20px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">What you can do on Gospello</p>
          <table>${benefitRow('📅', 'Post gospel events for free')}${benefitRow('🇳🇬', 'Reach believers across all 36 states')}${benefitRow('💬', 'WhatsApp sharing built in')}</table>
        </td></tr>
      </table>`
    ),
  }
}

/* ─── EMAIL 2: Email verified ───────────────────────────────────────── */
export function emailVerified(firstName: string) {
  return {
    subject: `You're in! Your Gospello account is ready ✅`,
    html: layout(
      '#059669',
      `<div style="font-size:32px;margin-bottom:8px;">✅</div>
       <span style="font-size:22px;font-weight:900;color:#FFFFFF;">Account Verified</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Hi ${firstName}, you're all set! 🎉</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
        Your email has been confirmed. Your Gospello account is live and ready to use.
      </p>
      ${btn(`${SITE}/dashboard`, 'Go to My Dashboard')}
      <p style="margin:24px 0 16px;font-size:14px;color:#374151;">Start by posting your first event — it only takes 5 minutes.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;padding:20px;margin-top:8px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">What you can do now</p>
          <table>
            ${benefitRow('✓', 'Post gospel events for free')}
            ${benefitRow('✓', 'Manage attendees and registrations')}
            ${benefitRow('✓', 'Share events directly to WhatsApp')}
            ${benefitRow('✓', 'Reach believers across Nigeria')}
          </table>
        </td></tr>
      </table>`
    ),
  }
}

/* ─── EMAIL 3: Forgot password ──────────────────────────────────────── */
export function emailForgotPassword(firstName: string, resetUrl: string) {
  return {
    subject: `Reset your Gospello password`,
    html: layout(
      '#7C3AED',
      logoHeader(),
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Password reset request</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
        Hi ${firstName}, we received a request to reset the password for your Gospello account.
        Click the button below to create a new password.
      </p>
      ${btn(resetUrl, 'Reset My Password')}
      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        This link expires in 1 hour.<br>
        If you didn't request a password reset, please ignore this email — your account is safe.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F9FAFB;border-radius:8px;padding:16px 20px;">
        <tr><td style="font-size:13px;color:#6B7280;">
          🔒 <strong>For your security:</strong> Gospello will never ask for your password via email or WhatsApp.
        </td></tr>
      </table>`
    ),
  }
}

/* ─── EMAIL 4: Event approved ───────────────────────────────────────── */
export function emailApproved(title: string, slug: string, organizerName?: string) {
  const eventUrl = `${SITE}/events/${slug}`
  const waText = encodeURIComponent(`${title} 👉 ${eventUrl}`)
  return {
    subject: `Your event is approved and live on Gospello! 🎉`,
    html: layout(
      '#059669',
      `<div style="font-size:36px;margin-bottom:8px;">🎉</div>
       <span style="font-size:22px;font-weight:900;color:#FFFFFF;">Your Event is Live!</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Great news${organizerName ? `, ${organizerName}` : ''}!</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        <strong>${title}</strong> has been reviewed and approved by the Gospello team.
        It's now visible to believers across Nigeria.
      </p>
      <!-- Event link box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;margin-bottom:4px;">
        <tr><td style="font-size:14px;color:#374151;word-break:break-all;">
          <strong>Your event link:</strong><br>
          <a href="${eventUrl}" style="color:#7C3AED;text-decoration:none;">${eventUrl}</a>
        </td></tr>
      </table>
      ${btn(eventUrl, 'View Your Live Event')}
      <!-- Share section -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#F0FDF4;border-radius:8px;padding:20px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065F46;">💬 Share on WhatsApp</p>
          <p style="margin:0 0 12px;font-size:13px;color:#374151;">Forward to your WhatsApp groups and church family:</p>
          <a href="https://wa.me/?text=${waText}" style="display:block;background:#25D366;color:#FFFFFF;text-align:center;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Share on WhatsApp →</a>
        </td></tr>
      </table>
      <!-- Tips -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#F9FAFB;border-radius:8px;padding:20px;">
        <tr><td>
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Reach more people</p>
          <table>
            ${benefitRow('💬', 'Share in your WhatsApp groups')}
            ${benefitRow('📸', 'Post on your church&apos;s Instagram')}
            ${benefitRow('📋', 'Add to your church bulletin')}
          </table>
        </td></tr>
      </table>`
    ),
  }
}

/* ─── EMAIL 5: Event rejected ───────────────────────────────────────── */
export function emailRejected(title: string, reason: string, eventId?: string) {
  const dashUrl = eventId ? `${SITE}/dashboard/events/${eventId}/edit` : `${SITE}/dashboard/events`
  return {
    subject: `Action needed — Your Gospello event needs some changes`,
    html: layout(
      '#D97706',
      `<span style="font-size:22px;font-weight:900;color:#FFFFFF;">Event Needs Attention</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Thank you for submitting your event</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        After reviewing <strong>"${title}"</strong>, our team has some feedback before we can publish it.
      </p>
      <!-- Reason box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #D97706;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">Feedback from our team</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${reason}</p>
        </td></tr>
      </table>
      ${btn(dashUrl, 'Edit My Event', '#D97706')}
      <p style="margin:24px 0 0;font-size:14px;color:#374151;text-align:center;line-height:1.6;">
        Once you've made the changes, resubmit your event for review.<br>
        Our team typically reviews events within 24 hours.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        Have questions? Reply to this email or contact
        <a href="mailto:support@gospello.com" style="color:#7C3AED;">support@gospello.com</a>
      </p>`
    ),
  }
}

/* ─── EMAIL 6: New attendee registered (to organizer) ───────────────── */
export function emailNewAttendee(params: {
  organizerName: string
  attendeeName: string
  attendeeEmail: string
  ticketNumber: number
  eventTitle: string
  eventDate: string
  totalRegistrations: number
  eventId: string
}) {
  const { organizerName, attendeeName, attendeeEmail, ticketNumber, eventTitle, eventDate, totalRegistrations, eventId } = params
  const ticketStr = `#${String(ticketNumber).padStart(4, '0')}`
  return {
    subject: `New registration for ${eventTitle} 👥`,
    html: layout(
      '#7C3AED',
      `<span style="font-size:16px;font-weight:900;color:#FFFFFF;letter-spacing:-0.3px;">New Registration</span>
       <div style="width:32px;height:3px;background:rgba(255,255,255,0.4);margin:8px auto 0;border-radius:2px;"></div>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Hi ${organizerName}, someone just registered!</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">Someone just registered for your event. Here are their details:</p>
      <!-- Registration card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;width:40px;">👤</td>
          <td style="padding:12px 16px;"><span style="font-size:13px;color:#9CA3AF;display:block;">Attendee Name</span><strong style="font-size:15px;color:#111827;">${attendeeName}</strong></td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;">📧</td>
          <td style="padding:12px 16px;"><span style="font-size:13px;color:#9CA3AF;display:block;">Email</span><span style="font-size:15px;color:#111827;">${attendeeEmail}</span></td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;">🎫</td>
          <td style="padding:12px 16px;"><span style="font-size:13px;color:#9CA3AF;display:block;">Ticket</span><strong style="font-size:18px;color:#7C3AED;">${ticketStr}</strong></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#6B7280;">📅</td>
          <td style="padding:12px 16px;"><span style="font-size:13px;color:#9CA3AF;display:block;">Event</span><span style="font-size:15px;color:#111827;">${eventTitle} · ${eventDate}</span></td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Total registrations so far: <strong style="color:#7C3AED;">${totalRegistrations}</strong>
      </p>
      ${btn(`${SITE}/dashboard/events/${eventId}`, 'View All Registrations')}`
    ),
  }
}

/* ─── EMAIL 7: Ticket confirmation (to attendee) ────────────────────── */
export function emailTicket(params: {
  eventTitle: string
  attendeeName: string
  ticketNumber: number
  eventDate: string
  eventLocation: string
  isPaid: boolean
  eventSlug?: string
}) {
  const { eventTitle, attendeeName, ticketNumber, eventDate, eventLocation, isPaid, eventSlug } = params
  const ticketStr = `#${String(ticketNumber).padStart(4, '0')}`
  const eventUrl = eventSlug ? `${SITE}/events/${eventSlug}` : SITE
  return {
    subject: `🎟 Your ticket for "${eventTitle}" — ${ticketStr}`,
    html: layout(
      '#312E81',
      `<span style="font-size:26px;font-weight:900;color:#FFFFFF;">GOSPELLO</span>
       <div style="font-size:11px;color:#C7D2FE;margin-top:4px;letter-spacing:2px;">EVENT TICKET ${ticketStr}</div>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">You're registered! 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Hi <strong>${attendeeName}</strong>, your ticket for <strong>${eventTitle}</strong> is confirmed.
      </p>
      <!-- Ticket card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;"><span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;font-weight:700;">Event</span><br><strong style="font-size:15px;color:#111827;">${eventTitle}</strong></td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;"><span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;font-weight:700;">Date</span><br><span style="font-size:15px;color:#111827;">${eventDate}</span></td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;"><span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;font-weight:700;">Location</span><br><span style="font-size:15px;color:#111827;">${eventLocation}</span></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;"><span style="font-size:12px;color:#9CA3AF;text-transform:uppercase;font-weight:700;">Ticket Number</span><br>
            <strong style="font-size:22px;color:#7C3AED;">${ticketStr}</strong>
            ${isPaid ? '<span style="background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:3px 8px;border-radius:12px;margin-left:8px;">PAID</span>' : ''}
          </td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Present your ticket number at the event entrance.
      </p>
      ${btn(eventUrl, 'View Event Details')}`
    ),
  }
}

/* ─── EMAIL 8: Event reminder (24h before, to attendee) ─────────────── */
export function emailReminder(params: {
  attendeeName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventAddress: string
  ticketNumber: number
  eventSlug: string
}) {
  const { attendeeName, eventTitle, eventDate, eventTime, eventLocation, eventAddress, ticketNumber, eventSlug } = params
  const ticketStr = `#${String(ticketNumber).padStart(4, '0')}`
  const eventUrl = `${SITE}/events/${eventSlug}`
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(eventAddress)}`
  return {
    subject: `Reminder: ${eventTitle} is tomorrow! 🔔`,
    html: layout(
      '#7C3AED',
      `<span style="font-size:20px;font-weight:900;color:#FFFFFF;">See You Tomorrow!</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Hi ${attendeeName} 👋</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Just a reminder that an event you registered for is happening <strong>tomorrow</strong>.
      </p>
      <!-- Event card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:14px 16px;"><strong style="font-size:17px;color:#111827;">${eventTitle}</strong></td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;font-size:14px;color:#374151;">📅 &nbsp;${eventDate} · ${eventTime}</td>
        </tr>
        <tr style="border-bottom:1px solid #E5E7EB;">
          <td style="padding:12px 16px;font-size:14px;color:#374151;">
            📍 &nbsp;${eventLocation}<br>
            <a href="${mapsUrl}" style="font-size:12px;color:#7C3AED;text-decoration:none;margin-top:4px;display:inline-block;">Open in Google Maps →</a>
          </td>
        </tr>
      </table>
      ${btn(eventUrl, 'View Event Details')}
      <!-- Ticket -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#F9FAFB;border-radius:8px;padding:16px 20px;text-align:center;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">Your ticket number</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#7C3AED;letter-spacing:2px;">${ticketStr}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;">Save this ticket number — you may need it at the event entrance.</p>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        Can't make it? Let the organizer know by replying to this email.
      </p>`
    ),
  }
}

/* ─── EMAIL 9: Account suspended ────────────────────────────────────── */
export function emailSuspended(name: string, reason: string) {
  return {
    subject: `Important: Your Gospello account has been suspended`,
    html: layout(
      '#DC2626',
      `<span style="font-size:22px;font-weight:900;color:#FFFFFF;">Account Suspended</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Hi ${name},</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Your Gospello account has been temporarily suspended by our team.
      </p>
      <!-- Reason box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${reason}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:700;">During your suspension:</p>
      <table style="margin-bottom:20px;">
        ${benefitRow('•', 'Your events are not visible on Gospello')}
        ${benefitRow('•', 'You cannot post new events')}
        ${benefitRow('•', 'Your account access is restricted')}
      </table>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
        If you believe this is a mistake or would like to appeal, please contact our support team.
      </p>
      ${btn('mailto:support@gospello.com', 'Contact Support', '#DC2626')}`
    ),
  }
}

/* ─── EMAIL 10: Account restored ────────────────────────────────────── */
export function emailRestored(name: string) {
  return {
    subject: `Your Gospello account has been restored ✅`,
    html: layout(
      '#059669',
      `<span style="font-size:22px;font-weight:900;color:#FFFFFF;">Account Restored</span>`,
      `<h2 style="margin:0 0 12px;font-size:22px;color:#111827;">Good news, ${name}! 🎉</h2>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Your Gospello account suspension has been lifted. You can now access your account fully.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:8px;padding:20px;margin-bottom:20px;">
        <tr><td>
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;">You can now</p>
          <table>
            ${benefitRow('✓', 'Log in to your dashboard')}
            ${benefitRow('✓', 'Post and manage events')}
            ${benefitRow('✓', 'Access all your registrations')}
          </table>
        </td></tr>
      </table>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;">
        Your previously suspended events have been restored and are live again.
      </p>
      ${btn(`${SITE}/dashboard`, 'Go to My Dashboard', '#059669')}
      <p style="margin:24px 0 0;font-size:13px;color:#9CA3AF;text-align:center;">
        Thank you for your understanding. Questions?
        <a href="mailto:support@gospello.com" style="color:#7C3AED;">support@gospello.com</a>
      </p>`
    ),
  }
}
