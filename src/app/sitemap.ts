import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch approved upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(500)

  // Fetch churches
  const { data: churches } = await supabase
    .from('churches')
    .select('slug, updated_at')
    .order('name', { ascending: true })
    .limit(200)

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/events`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE}/churches`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/organizers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ]

  const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
    url: `${SITE}/events/${e.slug}`,
    lastModified: new Date(e.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const churchRoutes: MetadataRoute.Sitemap = (churches ?? []).map((c) => ({
    url: `${SITE}/churches/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...eventRoutes, ...churchRoutes]
}
