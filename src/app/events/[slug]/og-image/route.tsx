import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('events')
    .select('title, banner_url, city, state, start_date, is_free')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) {
    return new Response('Not found', { status: 404 })
  }

  const dateStr = formatDate(data.start_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const location = [data.city, data.state].filter(Boolean).join(', ')

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          position: 'relative',
          backgroundColor: '#1e1b4b',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Banner as background */}
        {data.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.banner_url}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}

        {/* Dark gradient overlay so text is readable */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)',
            display: 'flex',
          }}
        />

        {/* Gospello pill — top right */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            right: 36,
            backgroundColor: 'rgba(255,255,255,0.18)',
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            padding: '8px 22px',
            borderRadius: 999,
            letterSpacing: '0.02em',
            display: 'flex',
          }}
        >
          gospello.com
        </div>

        {/* Free / Paid badge — top left */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 36,
            backgroundColor: data.is_free ? 'rgba(16,185,129,0.85)' : 'rgba(245,158,11,0.85)',
            color: 'white',
            fontSize: 18,
            fontWeight: 700,
            padding: '8px 20px',
            borderRadius: 999,
            display: 'flex',
          }}
        >
          {data.is_free ? 'Free Event' : 'Paid Event'}
        </div>

        {/* Bottom text block */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 48px 44px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Title */}
          <div
            style={{
              color: 'white',
              fontSize: data.title.length > 40 ? 44 : 56,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {data.title}
          </div>

          {/* Date + location row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              color: 'rgba(255,255,255,0.8)',
              fontSize: 24,
              fontWeight: 500,
            }}
          >
            <span>📅 {dateStr}</span>
            {location && <span>📍 {location}</span>}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  )
}
