import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('events')
    .select('banner_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!data?.banner_url) {
    return new Response('Not found', { status: 404 })
  }

  // Render the banner as a clean 1200×630 crop — no overlays, no text.
  // objectFit: cover ensures portrait/landscape banners always fill the frame.
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.banner_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    },
  )
}
