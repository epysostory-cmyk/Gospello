import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Africa/Lagos',
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'square' // 'square' | 'story'

  const supabase = createAdminClient()
  const { data: event } = await supabase
    .from('events')
    .select('title, start_date, end_date, city, state, location_name, is_online, banner_url, is_free, price, currency, churches(name), profiles(display_name), seeded_organizers(name)')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (!event) return new Response('Not found', { status: 404 })

  const isStory = format === 'story'
  const W = 1080
  const H = isStory ? 1920 : 1080

  const hostName = (event as any).churches?.name
    ?? (event as any).seeded_organizers?.name
    ?? (event as any).profiles?.display_name
    ?? 'Gospello'

  const venue = (event as any).is_online
    ? 'Online Event'
    : [(event as any).location_name, (event as any).city].filter(Boolean).join(', ') || 'Nigeria'

  const price = (event as any).is_free
    ? 'Free'
    : (event as any).price != null
    ? `${(event as any).currency ?? '₦'}${Number((event as any).price).toLocaleString()}`
    : 'Paid'

  const dateStr = fmtDate((event as any).start_date)

  // Try to fetch banner as base64 for embedding
  let bannerB64: string | null = null
  if ((event as any).banner_url) {
    try {
      const res = await fetch((event as any).banner_url)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        const b64 = Buffer.from(buf).toString('base64')
        const mime = res.headers.get('content-type') ?? 'image/jpeg'
        bannerB64 = `data:${mime};base64,${b64}`
      }
    } catch { /* skip banner */ }
  }

  const titleLen = ((event as any).title as string).length
  const titleSize = titleLen > 60 ? 52 : titleLen > 40 ? 62 : titleLen > 25 ? 74 : 88

  return new ImageResponse(
    <div
      style={{
        width: W, height: H,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(145deg, #0f0720 0%, #1a0a3d 40%, #0d1b4b 100%)',
        position: 'relative', overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Banner image as background with heavy overlay */}
      {bannerB64 && (
        <img
          src={bannerB64}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.18,
          }}
        />
      )}

      {/* Gradient overlay — heavier at bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(15,7,32,0.3) 0%, rgba(15,7,32,0.5) 40%, rgba(15,7,32,0.95) 100%)',
      }} />

      {/* Decorative glow circles */}
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
      }} />

      {/* Top bar — Gospello logo */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        padding: isStory ? '60px 70px 0' : '52px 68px 0',
        gap: 18,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(124,58,237,0.6)',
        }}>
          <span style={{ color: 'white', fontSize: 30, fontWeight: 900 }}>G</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Gospello
        </span>
        {/* Price badge */}
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          <div style={{
            background: (event as any).is_free ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.3)',
            border: `1.5px solid ${(event as any).is_free ? 'rgba(16,185,129,0.5)' : 'rgba(124,58,237,0.6)'}`,
            borderRadius: 40, padding: '10px 24px',
            color: (event as any).is_free ? '#6ee7b7' : '#c4b5fd',
            fontSize: 22, fontWeight: 800,
          }}>
            {price}
          </div>
        </div>
      </div>

      {/* Main content — centered vertically */}
      <div style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: isStory ? 'flex-end' : 'center',
        padding: isStory ? '0 70px 100px' : '0 68px',
        gap: 0,
      }}>
        {/* Banner thumbnail (story format only) */}
        {isStory && bannerB64 && (
          <div style={{
            width: '100%', height: 640, borderRadius: 32, overflow: 'hidden',
            marginBottom: 64, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            display: 'flex',
          }}>
            <img src={bannerB64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Host name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
        }}>
          <div style={{ width: 5, height: 32, background: '#7C3AED', borderRadius: 3 }} />
          <span style={{ color: '#a78bfa', fontSize: 26, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {hostName}
          </span>
        </div>

        {/* Event title */}
        <div style={{
          color: 'white', fontSize: titleSize, fontWeight: 900,
          lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 48,
        }}>
          {(event as any).title}
        </div>

        {/* Info pills row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {/* Date */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '18px 28px',
          }}>
            <span style={{ fontSize: 28 }}>📅</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: 600 }}>
              {dateStr}
            </span>
          </div>

          {/* Venue */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, padding: '18px 28px',
          }}>
            <span style={{ fontSize: 28 }}>{(event as any).is_online ? '🌐' : '📍'}</span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: 600 }}>
              {venue}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isStory ? '0 70px 70px' : '0 68px 52px',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: 600, letterSpacing: '1px' }}>
          gospello.com
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.3)', fontSize: 20,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '8px 20px',
        }}>
          Discover Gospel Events
        </span>
      </div>
    </div>,
    { width: W, height: H }
  )
}
