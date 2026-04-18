import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for event OG images.
 *
 * WhatsApp (and Facebook's scraper) often fails to fetch images directly from
 * third-party CDN domains like Supabase Storage. By serving the image through
 * gospello.com/events/[slug]/og-image we stay on a first-party domain the
 * scraper trusts, and we can set the Cache-Control header ourselves.
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
    .eq('status', 'approved')
    .single()

  if (!data?.banner_url) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Strip any Supabase signed-URL tokens — public bucket URLs don't need them
  const imageUrl = data.banner_url.split('?')[0]

  try {
    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      return new NextResponse('Image unavailable', { status: 502 })
    }

    const buffer = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        // Cache for 1 hour on CDN edge, 24 h in browser — WhatsApp re-scrapes
        // infrequently, so a longer edge TTL is fine.
        'Cache-Control': 'public, max-age=86400, s-maxage=3600',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
