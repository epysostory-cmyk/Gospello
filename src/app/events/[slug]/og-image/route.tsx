import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  worship:      'Worship',
  conference:   'Conference',
  crusade:      'Crusade',
  prayer:       'Prayer',
  concert:      'Concert',
  seminar:      'Seminar',
  youth:        'Youth',
  children:     'Children',
  outreach:     'Outreach',
  thanksgiving: 'Thanksgiving',
  other:        'Other',
}

function formatOgDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('events')
    .select('title, banner_url, start_date, city, state, is_free, category, location_name')
    .eq('slug', slug)
    .maybeSingle()

  if (!data?.banner_url) {
    return new Response('Not found', { status: 404 })
  }

  const dateStr      = formatOgDate(data.start_date)
  const cityState    = [data.city, data.state].filter(Boolean).join(', ')
  const categoryLabel = CATEGORY_LABELS[data.category] ?? (data.category ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
          backgroundColor: '#0f0f0f',
        }}
      >
        {/* Full-bleed background banner — center crop */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.banner_url}
          alt=""
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />

        {/* Gradient overlay — bottom 60% → black */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Top-right: Gospello wordmark */}
        <div
          style={{
            position: 'absolute',
            top: 32, right: 44,
            color: 'rgba(255,255,255,0.90)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          Gospello
        </div>

        {/* Bottom-left: category + title + date/location + badges */}
        <div
          style={{
            position: 'absolute',
            bottom: 44, left: 52, right: 52,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Category pill */}
          <div style={{ display: 'flex' }}>
            <span
              style={{
                background: 'rgba(124,58,237,0.90)',
                color: 'white',
                fontSize: 19,
                fontWeight: 600,
                padding: '4px 18px',
                borderRadius: 100,
              }}
            >
              {categoryLabel}
            </span>
          </div>

          {/* Event title — max 2 lines */}
          <div
            style={{
              color: 'white',
              fontSize: 54,
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: 1000,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.title}
          </div>

          {/* Date & location */}
          <div
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 26,
              display: 'flex',
              gap: 32,
            }}
          >
            {dateStr   && <span>📅 {dateStr}</span>}
            {cityState && <span>📍 {cityState}</span>}
          </div>

          {/* Bottom row: Free/Paid badge + gospello.com */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <span
              style={{
                background: data.is_free ? 'rgba(16,185,129,0.90)' : 'rgba(59,130,246,0.90)',
                color: 'white',
                fontSize: 19,
                fontWeight: 600,
                padding: '4px 18px',
                borderRadius: 100,
              }}
            >
              {data.is_free ? 'Free' : 'Paid'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 21 }}>
              gospello.com
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  )
}
