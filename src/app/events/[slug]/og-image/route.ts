import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for event OG images.
 *
 * WhatsApp's scraper (facebookexternalhit) often fails to fetch images
 * directly from Supabase Storage URLs. This route fetches the banner
 * server-side and re-serves it from gospello.com so scrapers trust it.
 */
export async function GET(
  _req: NextRequest,
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
    return new NextResponse('No banner for this event', { status: 404 })
  }

  const imageUrl = data.banner_url.split('?')[0]

  try {
    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      return new NextResponse('Upstream image unavailable', { status: 502 })
    }

    const buffer = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=3600',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
