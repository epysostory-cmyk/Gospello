const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Gospello <noreply@gospello.ng>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

/** Sends an email via Resend. Silently returns false if RESEND_API_KEY is not set. */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function emailApproved(title: string, slug: string) {
  return {
    subject: `✅ Your event "${title}" is now live on Gospello`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
        <div style="background:#4f46e5;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="color:white;font-size:22px;font-weight:bold">Gospello</span>
        </div>
        <h2 style="color:#111827;margin-bottom:8px">Your event is live! 🎉</h2>
        <p style="color:#374151;line-height:1.6">
          Great news — <strong>${title}</strong> has been reviewed and approved.
          It's now visible to everyone on Gospello.
        </p>
        <a href="${SITE}/events/${slug}"
          style="display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;
                 text-decoration:none;font-weight:600;margin-top:20px">
          View your event →
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:32px">
          You received this email because you posted an event on Gospello.
        </p>
      </div>
    `,
  }
}

export function emailRejected(title: string, reason: string) {
  return {
    subject: `Event submission update: "${title}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
        <div style="background:#4f46e5;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="color:white;font-size:22px;font-weight:bold">Gospello</span>
        </div>
        <h2 style="color:#111827;margin-bottom:8px">Event submission update</h2>
        <p style="color:#374151;line-height:1.6">
          Unfortunately, <strong>${title}</strong> was not approved at this time.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-top:16px">
          <p style="margin:0;color:#7f1d1d"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="color:#374151;margin-top:16px;line-height:1.6">
          You can edit your event from your dashboard and resubmit for review.
        </p>
        <a href="${SITE}/dashboard/events"
          style="display:inline-block;background:#4f46e5;color:white;padding:12px 28px;border-radius:8px;
                 text-decoration:none;font-weight:600;margin-top:20px">
          Go to dashboard →
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:32px">
          You received this email because you posted an event on Gospello.
        </p>
      </div>
    `,
  }
}
