import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface FooterColumn {
  heading: string
  links: { label: string; url: string }[]
}

interface FooterSettings {
  footer_logo_url: string | null
  footer_tagline: string
  footer_columns: FooterColumn[]
  footer_social: {
    instagram: string
    twitter: string
    facebook: string
    youtube: string
    tiktok: string
    whatsapp: string
  }
  footer_copyright: string
  footer_contact_email: string
  footer_bottom_links: { label: string; url: string }[]
  footer_badges: string[]
}

const DEFAULTS: FooterSettings = {
  footer_logo_url: null,
  footer_tagline: "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
  footer_columns: [
    {
      heading: 'Explore',
      links: [
        { label: 'Events',     url: '/events' },
        { label: 'Categories', url: '/categories' },
        { label: 'Churches',   url: '/churches' },
        { label: 'Organizers', url: '/organizers' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us',       url: '/about' },
        { label: 'Contact Us',     url: '/contact' },
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Use',   url: '/terms' },
      ],
    },
  ],
  footer_social: { instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', whatsapp: '' },
  footer_copyright: '© {year} Gospello. All rights reserved.',
  footer_contact_email: '',
  footer_bottom_links: [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Use',   url: '/terms' },
  ],
  footer_badges: ['🇳🇬 Nigeria', '⛪ Churches', '🙏 Est. 2025'],
}

async function getFooterData(): Promise<FooterSettings> {
  noStore()
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('key, value')
      .in('key', ['footer_logo_url', 'footer_tagline', 'footer_columns', 'footer_social', 'footer_copyright', 'footer_contact_email', 'footer_bottom_links', 'footer_badges'])

    if (!data || data.length === 0) return DEFAULTS

    const map: Record<string, unknown> = {}
    for (const row of data) {
      if (row.key && row.value !== null) map[row.key] = row.value
    }

    function parse<T>(val: unknown, fallback: T): T {
      if (val === null || val === undefined) return fallback
      if (typeof val === 'string') { try { return JSON.parse(val) as T } catch { return val as unknown as T } }
      return val as T
    }

    return {
      footer_logo_url:      (map['footer_logo_url'] as string | null) ?? null,
      footer_tagline:       parse<string>(map['footer_tagline'], DEFAULTS.footer_tagline),
      footer_columns:       parse<FooterColumn[]>(map['footer_columns'], DEFAULTS.footer_columns),
      footer_social:        parse<FooterSettings['footer_social']>(map['footer_social'], DEFAULTS.footer_social),
      footer_copyright:     parse<string>(map['footer_copyright'], DEFAULTS.footer_copyright),
      footer_contact_email: parse<string>(map['footer_contact_email'], DEFAULTS.footer_contact_email),
      footer_bottom_links:  parse<{ label: string; url: string }[]>(map['footer_bottom_links'], DEFAULTS.footer_bottom_links),
      footer_badges:        parse<string[]>(map['footer_badges'], DEFAULTS.footer_badges),
    }
  } catch {
    return DEFAULTS
  }
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  twitter:   'X / Twitter',
  facebook:  'Facebook',
  youtube:   'YouTube',
  tiktok:    'TikTok',
  whatsapp:  'WhatsApp',
}

export default async function Footer() {
  const settings = await getFooterData()
  const year = new Date().getFullYear()
  const copyright = settings.footer_copyright.replace('{year}', String(year))
  const socialEntries = Object.entries(settings.footer_social).filter(([, v]) => v)
  const resolvedLogoUrl = settings.footer_logo_url

  return (
    <footer className="bg-gray-50 border-t border-gray-200">

      {/* ── MAIN FOOTER BODY ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {resolvedLogoUrl ? (
                <Image src={resolvedLogoUrl} alt="Gospello logo" width={100} height={40} className="object-contain h-8 w-auto" />
              ) : (
                <>
                  <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span className="text-base font-bold text-gray-900">Gospello</span>
                </>
              )}
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {settings.footer_tagline}
            </p>

            {/* Badges */}
            {settings.footer_badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {settings.footer_badges.map((badge, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {SOCIAL_LABELS[platform] ?? platform}
                  </a>
                ))}
              </div>
            )}

            {/* CTA */}
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Post an Event →
            </Link>
          </div>

          {/* Dynamic columns */}
          {settings.footer_columns.slice(0, 2).map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">{col.heading}</h3>
              <ul className="space-y-0.5">
                {col.links.map((link) => (
                  <li key={link.url + link.label}>
                    <Link
                      href={link.url}
                      className="block text-sm text-gray-500 hover:text-gray-900 py-1.5 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────── */}
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-xs text-gray-400">{copyright}</p>
            <div className="flex items-center gap-4">
              {settings.footer_bottom_links.map((lnk, i) => (
                <span key={lnk.url + i} className="flex items-center gap-4">
                  {i > 0 && <span className="text-gray-300">·</span>}
                  <Link href={lnk.url} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                    {lnk.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
