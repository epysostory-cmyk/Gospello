import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'Africa/Lagos' }).toUpperCase()
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'Africa/Lagos' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' })
}
function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'square'

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

  const hostName: string = (event as any).churches?.name
    ?? (event as any).seeded_organizers?.name
    ?? (event as any).profiles?.display_name
    ?? 'Gospello'

  const venue: string = (event as any).is_online
    ? 'Online Event'
    : [(event as any).location_name, (event as any).city].filter(Boolean).join(' · ') || 'Nigeria'

  const isFree: boolean = (event as any).is_free
  const priceLabel: string = isFree
    ? 'Free'
    : (event as any).price != null
    ? `₦${Number((event as any).price).toLocaleString()}`
    : 'Paid'

  const startIso: string = (event as any).start_date
  const title: string = (event as any).title

  // Fetch banner
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
    } catch { /* skip */ }
  }

  // Title font sizing
  const titleLen = title.length
  const titleSize = isStory
    ? (titleLen > 60 ? 62 : titleLen > 40 ? 72 : titleLen > 25 ? 84 : 96)
    : (titleLen > 60 ? 52 : titleLen > 40 ? 62 : titleLen > 25 ? 72 : 82)

  // Layout measurements
  const bannerH = isStory ? 760 : 480
  const contentPad = isStory ? 80 : 68

  return new ImageResponse(
    <div
      style={{
        width: W, height: H,
        display: 'flex', flexDirection: 'column',
        background: '#0b0b12',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* ── Banner section ── */}
      <div style={{ width: W, height: bannerH, position: 'relative', display: 'flex', flexShrink: 0 }}>
        {bannerB64 ? (
          <img
            src={bannerB64}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'flex' }}
          />
        ) : (
          /* Fallback gradient banner */
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            background: 'linear-gradient(135deg, #13001f 0%, #1e0a3c 50%, #0d1b4b 100%)',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
              display: 'flex',
            }} />
          </div>
        )}
        {/* Scrim at bottom of banner for smooth transition */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
          background: 'linear-gradient(to bottom, transparent, #0b0b12)',
          display: 'flex',
        }} />
      </div>

      {/* ── Content section ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: `32px ${contentPad}px ${isStory ? 80 : 56}px`,
        position: 'relative',
      }}>

        {/* Host + price row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: isStory ? 36 : 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Host avatar circle */}
            <div style={{
              width: isStory ? 56 : 48, height: isStory ? 56 : 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontSize: isStory ? 24 : 20, fontWeight: 800 }}>
                {hostName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: isStory ? 26 : 22,
              fontWeight: 600,
              letterSpacing: '0.2px',
            }}>
              {hostName}
            </span>
          </div>

          {/* Price badge */}
          <div style={{
            background: isFree ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.2)',
            border: `1.5px solid ${isFree ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.5)'}`,
            borderRadius: 100, padding: isStory ? '12px 28px' : '10px 22px',
            display: 'flex',
          }}>
            <span style={{
              color: isFree ? '#34d399' : '#a78bfa',
              fontSize: isStory ? 24 : 20,
              fontWeight: 800,
              letterSpacing: '-0.3px',
            }}>
              {priceLabel}
            </span>
          </div>
        </div>

        {/* Event title */}
        <div style={{
          color: '#ffffff',
          fontSize: titleSize,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-1px',
          marginBottom: isStory ? 48 : 36,
          flex: isStory ? 0 : 1,
          display: 'flex',
          alignItems: isStory ? 'flex-start' : 'center',
        }}>
          {title}
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', height: 1,
          background: 'rgba(255,255,255,0.08)',
          marginBottom: isStory ? 40 : 30,
          display: 'flex',
        }} />

        {/* Date + venue row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isStory ? 48 : 36,
          marginBottom: isStory ? 40 : 0,
        }}>
          {/* Date block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Calendar badge */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: '#1a1a2e',
              border: '1.5px solid rgba(255,255,255,0.1)',
              borderRadius: isStory ? 18 : 14,
              overflow: 'hidden',
              width: isStory ? 80 : 66,
              flexShrink: 0,
            }}>
              <div style={{
                background: '#7C3AED',
                width: '100%',
                padding: isStory ? '6px 0' : '5px 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: isStory ? 18 : 15, fontWeight: 700, letterSpacing: '1px' }}>
                  {fmtMonth(startIso)}
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isStory ? '8px 0' : '6px 0',
              }}>
                <span style={{ color: 'white', fontSize: isStory ? 34 : 28, fontWeight: 900, lineHeight: 1 }}>
                  {fmtDay(startIso)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: isStory ? 26 : 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {fmtTime(startIso)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: isStory ? 20 : 17, fontWeight: 500 }}>
                {fmtFullDate(startIso).split(',').slice(0, 2).join(',')}
              </span>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{
            width: 1, height: isStory ? 60 : 50,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', flexShrink: 0,
          }} />

          {/* Venue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, overflow: 'hidden' }}>
            <div style={{
              width: isStory ? 44 : 36, height: isStory ? 44 : 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: isStory ? 22 : 18 }}>
                {(event as any).is_online ? '🌐' : '📍'}
              </span>
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: isStory ? 24 : 20,
              fontWeight: 600,
              letterSpacing: '-0.2px',
              overflow: 'hidden',
            }}>
              {venue}
            </span>
          </div>
        </div>

        {/* Bottom bar: gospello branding */}
        {!isStory && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 'auto', paddingTop: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="https://atrdstihzvnvbgxveplm.supabase.co/storage/v1/object/public/site-assets/logo/dccedb39-bf4b-4b4b-beec-fc285f57ad68/1777020281172.png"
                style={{ height: 28, width: 'auto', display: 'flex' }}
                alt="Gospello"
              />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 700, letterSpacing: '0.5px' }}>
                gospello.com
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 500 }}>
              Discover Gospel Events
            </span>
          </div>
        )}
      </div>

      {/* Story: bottom branding */}
      {isStory && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          paddingBottom: 80,
        }}>
          <img
            src="https://atrdstihzvnvbgxveplm.supabase.co/storage/v1/object/public/site-assets/logo/dccedb39-bf4b-4b4b-beec-fc285f57ad68/1777020281172.png"
            style={{ height: 36, width: 'auto', display: 'flex' }}
            alt="Gospello"
          />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 24, fontWeight: 700, letterSpacing: '0.5px' }}>
            gospello.com
          </span>
        </div>
      )}
    </div>,
    { width: W, height: H }
  )
}
