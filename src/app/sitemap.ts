import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use admin client for all queries — sitemap is fetched by Google with no auth context
  const adminClient = createAdminClient()

  const [
    { data: events },
    { data: churches },
    { data: authOrganizers },
    { data: seededOrganizers },
  ] = await Promise.all([
    adminClient
      .from('events')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(500),
    adminClient
      .from('churches')
      .select('slug, updated_at')
      .eq('is_hidden', false)
      .order('name', { ascending: true })
      .limit(200),
    adminClient
      .from('profiles')
      .select('id, updated_at')
      .eq('account_type', 'organizer')
      .eq('is_hidden', false)
      .limit(200),
    adminClient
      .from('seeded_organizers')
      .select('slug, updated_at')
      .eq('is_hidden', false)
      .order('name', { ascending: true })
      .limit(200),
  ])

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

  const authOrgRoutes: MetadataRoute.Sitemap = (authOrganizers ?? []).map((o) => ({
    url: `${SITE}/organizers/${o.id}`,
    lastModified: new Date(o.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const seededOrgRoutes: MetadataRoute.Sitemap = (seededOrganizers ?? []).map((o) => ({
    url: `${SITE}/organizers/${o.slug}`,
    lastModified: new Date(o.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...eventRoutes, ...churchRoutes, ...authOrgRoutes, ...seededOrgRoutes]
}
