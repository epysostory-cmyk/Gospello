import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

interface ServiceEntry { day: string; name: string; time: string }

const DAY_LABELS: Record<string, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
}

function nextOccurrence(dayShort: string): string {
  const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const target = dayMap[dayShort] ?? 0
  const now = new Date()
  const diff = (target - now.getDay() + 7) % 7 || 7
  const next = new Date(now)
  next.setDate(now.getDate() + diff)
  return next.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const url = new URL(req.url)
  const theme = url.searchParams.get('theme') ?? ''
  const format = url.searchParams.get('format') ?? 'square'

  const supabase = createAdminClient()
  const { data: church } = await supabase
    .from('churches')
    .select('name, logo_url, address, city, state, service_times')
    .eq('slug', slug)
    .maybeSingle()

  if (!church) return new Response('Not found', { status: 404 })

  const isStory = format === 'story'
  const W = 1080
  const H = isStory ? 1920 : 1080

  let schedule: ServiceEntry[] = []
  if (church.service_times) {
    try { schedule = JSON.parse(church.service_times) } catch { /* legacy text */ }
  }

  const location = [church.city, church.state].filter(Boolean).join(', ') || 'Nigeria'

  // Fetch logo
  let logoB64: string | null = null
  if (church.logo_url) {
    try {
      const res = await fetch(church.logo_url)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        const mime = res.headers.get('content-type') ?? 'image/jpeg'
        logoB64 = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
      }
    } catch { /* skip */ }
  }

  const churchNameLen = church.name.length
  const nameSize = churchNameLen > 35 ? 56 : churchNameLen > 22 ? 70 : 86

  // Group schedule by day
  const grouped: Record<string, ServiceEntry[]> = {}
  for (const s of schedule) {
    if (!grouped[s.day]) grouped[s.day] = []
    grouped[s.day].push(s)
  }
  const days = Object.keys(grouped)

  return new ImageResponse(
    <div style={{
      width: W, height: H,
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(150deg, #0c1445 0%, #1a0a3d 50%, #0f1a35 100%)',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'sans-serif',
    }}>
      {/* Glow accents */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: -100,
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
      }} />

      {/* Top — Gospello wordmark */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isStory ? '60px 70px 0' : '52px 68px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: '#7C3AED',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(124,58,237,0.5)',
          }}>
            <span style={{ color: 'white', fontSize: 26, fontWeight: 900 }}>G</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: 800 }}>Gospello</span>
        </div>

        <div style={{
          background: 'rgba(124,58,237,0.25)', border: '1.5px solid rgba(124,58,237,0.5)',
          borderRadius: 40, padding: '10px 24px',
          color: '#c4b5fd', fontSize: 20, fontWeight: 700,
        }}>
          Sunday Service
        </div>
      </div>

      {/* Church identity */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 28,
        padding: isStory ? '60px 70px 0' : '52px 68px 0',
      }}>
        {logoB64 ? (
          <div style={{
            width: 110, height: 110, borderRadius: 28, overflow: 'hidden',
            border: '3px solid rgba(124,58,237,0.5)', flexShrink: 0,
            display: 'flex', background: 'rgba(255,255,255,0.05)',
          }}>
            <img src={logoB64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            width: 110, height: 110, borderRadius: 28, flexShrink: 0,
            background: 'linear-gradient(135deg, #7C3AED, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(124,58,237,0.4)',
          }}>
            <span style={{ color: 'white', fontSize: 52, fontWeight: 900 }}>
              {church.name[0].toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ color: '#a78bfa', fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>
            You are invited to
          </span>
          <span style={{ color: 'white', fontSize: nameSize, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px' }}>
            {church.name}
          </span>
        </div>
      </div>

      {/* Theme / message title */}
      {theme && (
        <div style={{
          position: 'relative',
          margin: isStory ? '40px 70px 0' : '36px 68px 0',
          background: 'rgba(124,58,237,0.15)',
          border: '2px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '20px 32px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 32 }}>✨</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#a78bfa', fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              This week&apos;s message
            </span>
            <span style={{ color: 'white', fontSize: 34, fontWeight: 800, letterSpacing: '-0.5px' }}>
              {theme}
            </span>
          </div>
        </div>
      )}

      {/* Service schedule */}
      <div style={{
        position: 'relative', flex: 1,
        margin: isStory ? '40px 70px 0' : '36px 68px 0',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {schedule.length > 0 ? (
          days.slice(0, 3).map(day => {
            const services = grouped[day]
            const nextDate = nextOccurrence(day)
            return (
              <div key={day} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '24px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ color: '#a78bfa', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {DAY_LABELS[day] ?? day} · {nextDate}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {services.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'white', fontSize: 28, fontWeight: 800 }}>{s.name}</span>
                        {s.time && (
                          <span style={{
                            background: 'rgba(124,58,237,0.3)', borderRadius: 10, padding: '4px 14px',
                            color: '#c4b5fd', fontSize: 22, fontWeight: 700,
                          }}>{fmt12(s.time)}</span>
                        )}
                        {i < services.length - 1 && (
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 22 }}>·</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 40 }}>⛪</span>
              </div>
            )
          })
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '32px 40px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <span style={{ fontSize: 44 }}>⛪</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'white', fontSize: 34, fontWeight: 800 }}>Join us this Sunday</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24 }}>{location}</span>
            </div>
          </div>
        )}
      </div>

      {/* Location + bottom */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isStory ? '32px 70px 70px' : '28px 68px 52px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📍</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: 600 }}>
            {church.address ? `${church.address}, ` : ''}{location}
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 20, fontWeight: 600, letterSpacing: '1px' }}>
          gospello.com
        </span>
      </div>
    </div>,
    { width: W, height: H }
  )
}
