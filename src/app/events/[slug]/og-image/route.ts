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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'
  const defaultOgImage = `${siteUrl}/og-default.jpg`

  const { data } = await admin
    .from('events')
    .select('banner_url')
    .eq('slug', slug)
    .maybeSingle()

  // If no banner, redirect to the default branded OG image
  const imageUrl = data?.banner_url
    ? data.banner_url.split('?')[0]
    : defaultOgImage

  try {
    const upstream = await fetch(imageUrl)
    if (!upstream.ok) {
      // Even the upstream failed — send the default as a hard redirect
      return NextResponse.redirect(defaultOgImage, { status: 302 })
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
    return NextResponse.redirect(defaultOgImage, { status: 302 })
  }
}
