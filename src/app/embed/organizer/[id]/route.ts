import { createAdminClient } from '@/lib/supabase/admin'

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #fff; color: #111; font-size: 14px; line-height: 1.5;
  }
  a { color: inherit; text-decoration: none; }

  .header {
    display:flex; align-items:center; gap:10px;
    padding:14px 16px 12px; border-bottom:1px solid #f0f0f0;
  }
  .header-logo { width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0; background:#e5e7eb; }
  .header-logo-fallback {
    width:32px; height:32px; border-radius:50%;
    background:#7c3aed; color:#fff; font-weight:800; font-size:14px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .header-name { font-weight:700; font-size:13px; color:#111; flex:1; }
  .header-sub  { font-size:11px; color:#9ca3af; margin-top:1px; }

  .list { padding:4px 0; }
  .event-row {
    display:flex; gap:10px; padding:10px 16px; align-items:flex-start;
    border-bottom:1px solid #f9f9f9; transition:background 0.1s; cursor:pointer;
  }
  .event-row:last-child { border-bottom:none; }
  .event-row:hover { background:#fafafa; }

  .date-col { flex-shrink:0; width:40px; text-align:center; padding-top:2px; }
  .date-month { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#7c3aed; }
  .date-day   { font-size:22px; font-weight:800; color:#111; line-height:1; margin-top:1px; }

  .thumb { flex-shrink:0; width:56px; height:56px; border-radius:10px; object-fit:cover; background:#f3f4f6; display:block; }
  .thumb-fallback {
    flex-shrink:0; width:56px; height:56px; border-radius:10px;
    background:#ede9fe; display:flex; align-items:center; justify-content:center;
    font-weight:900; font-size:20px; color:#a78bfa;
  }

  .event-text { flex:1; min-width:0; }
  .event-title {
    font-weight:600; font-size:13.5px; color:#111; line-height:1.35;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .event-meta { font-size:11px; color:#9ca3af; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .event-badge { display:inline-block; margin-top:5px; font-size:10px; font-weight:600; padding:1px 7px; border-radius:99px; }
  .badge-free { background:#ecfdf5; color:#059669; }
  .badge-paid { background:#f3f4f6; color:#6b7280; }

  .empty { padding:32px 16px; text-align:center; color:#9ca3af; font-size:13px; }

  .footer {
    padding:10px 16px; border-top:1px solid #f0f0f0;
    display:flex; align-items:center; justify-content:flex-end;
  }
  .footer-link { font-size:11px; color:#9ca3af; display:inline-flex; align-items:center; gap:4px; }
  .footer-link:hover { color:#7c3aed; }
  .dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#7c3aed; margin-right:3px; }
`

function fmt12(dateStr: string): string {
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', id)
    .eq('account_type', 'organizer')
    .maybeSingle()

  if (!profile) {
    return new Response('<html><body style="font-family:sans-serif;padding:20px;color:#9ca3af;">Organizer not found.</body></html>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const now = new Date().toISOString()
  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, start_date, time_tba, location_name, city, state, is_online, is_free, price, banner_url')
    .eq('organizer_id', id)
    .eq('status', 'approved')
    .eq('visibility', 'public')
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(10)

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()

  const logoHtml = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" class="header-logo" />`
    : `<div class="header-logo-fallback">${profile.display_name[0]?.toUpperCase() ?? '?'}</div>`

  const eventsHtml = !events || events.length === 0
    ? `<div class="empty">No upcoming events scheduled yet.</div>`
    : events.map(event => {
        const d = new Date(event.start_date)
        const month = d.toLocaleDateString('en-NG', { month: 'short', timeZone: 'Africa/Lagos' })
        const day   = d.toLocaleDateString('en-NG', { day: 'numeric', timeZone: 'Africa/Lagos' })
        const time  = event.time_tba ? '' : fmt12(event.start_date) + ' · '
        const location = event.is_online
          ? 'Online'
          : [event.location_name, event.city].filter(Boolean).join(', ') || event.state || 'TBD'
        const thumbHtml = event.banner_url
          ? `<img src="${event.banner_url}" alt="" class="thumb" />`
          : `<div class="thumb-fallback">${event.title[0] ?? '?'}</div>`
        const badgeHtml = event.is_free
          ? `<span class="event-badge badge-free">Free</span>`
          : event.price != null
            ? `<span class="event-badge badge-paid">₦${event.price.toLocaleString()}</span>`
            : `<span class="event-badge badge-paid">Paid</span>`

        return `
          <a href="${siteUrl}/events/${event.slug}" target="_blank" rel="noopener noreferrer" class="event-row">
            <div class="date-col">
              <div class="date-month">${month}</div>
              <div class="date-day">${day}</div>
            </div>
            ${thumbHtml}
            <div class="event-text">
              <div class="event-title">${event.title}</div>
              <div class="event-meta">${time}${location}</div>
              ${badgeHtml}
            </div>
          </a>`
      }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${profile.display_name} — Upcoming Events</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div>
      <div class="header-name">${profile.display_name}</div>
      <div class="header-sub">Upcoming Events</div>
    </div>
  </div>
  <div class="list">${eventsHtml}</div>
  <div class="footer">
    <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="footer-link">
      <span class="dot"></span>Powered by Gospello
    </a>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Frame-Options': 'ALLOWALL',
    },
  })
}
