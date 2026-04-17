'use client'

import { useEffect } from 'react'

// Catches crashes in the root layout itself (getSiteSettings, Navbar, etc.)
export default function GlobalRootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Root layout error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#fff' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Minimal hardcoded nav — no imports that could fail */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>G</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#111' }}>Gospello</span>
            </a>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>This page couldn&apos;t load</h1>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', maxWidth: 340 }}>
              Something went wrong. Try again or go back to the homepage.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{ padding: '10px 24px', borderRadius: 10, background: '#7C3AED', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
              >
                Go to Homepage
              </a>
            </div>
          </div>

          <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: '#aaa', borderTop: '1px solid #f0f0f0' }}>
            © 2026 Gospello ·{' '}
            <a href="mailto:support@gospello.com" style={{ color: '#7C3AED', textDecoration: 'none' }}>support@gospello.com</a>
          </div>
        </div>
      </body>
    </html>
  )
}
