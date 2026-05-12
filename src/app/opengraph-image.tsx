import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gospello — Discover Christian Events Near You'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e0a3c 0%, #3b0764 40%, #6d28d9 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.18)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -80,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'rgba(109, 40, 217, 0.22)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(196, 181, 253, 0.07)',
            display: 'flex',
          }}
        />

        {/* Cross icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'rgba(255,255,255,0.12)',
            marginBottom: 28,
            border: '1.5px solid rgba(255,255,255,0.18)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="20" y="4" width="8" height="40" rx="4" fill="white" />
            <rect x="8" y="14" width="32" height="8" rx="4" fill="white" />
          </svg>
        </div>

        {/* Site name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1,
            marginBottom: 20,
            display: 'flex',
          }}
        >
          Gospello
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: 'rgba(221, 214, 254, 0.9)',
            letterSpacing: '0.2px',
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.4,
            marginBottom: 44,
            display: 'flex',
          }}
        >
          Discover Christian Events, Churches &amp; Organizers Near You
        </div>

        {/* Pills row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {['⛪ Churches', '🎤 Organizers', '🙏 Events', '📍 Nigeria'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 22px',
                borderRadius: 100,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '0.2px',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            color: 'rgba(196, 181, 253, 0.7)',
            fontSize: 18,
            letterSpacing: '0.5px',
            display: 'flex',
          }}
        >
          gospello.com
        </div>
      </div>
    ),
    { ...size }
  )
}
