import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'

interface FooterColumn {
  heading: string
  links: { label: string; url: string }[]
}

interface FooterSettings {
  site_logo_url: string | null
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
}

const DEFAULTS: FooterSettings = {
  site_logo_url: null,
  footer_tagline: "Nigeria's home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.",
  footer_columns: [
    {
      heading: 'Explore',
      links: [
        { label: 'Events', url: '/events' },
        { label: 'Categories', url: '/categories' },
        { label: 'Churches', url: '/churches' },
        { label: 'Organizers', url: '/organizers' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', url: '/about' },
        { label: 'Contact Us', url: '/contact' },
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Use', url: '/terms' },
      ],
    },
  ],
  footer_social: { instagram: '', twitter: '', facebook: '', youtube: '', tiktok: '', whatsapp: '' },
  footer_copyright: '© {year} Gospello. All rights reserved.',
  footer_contact_email: '',
  footer_bottom_links: [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Use', url: '/terms' },
  ],
}

async function getFooterData(): Promise<FooterSettings> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_logo_url', 'footer_tagline', 'footer_columns', 'footer_social', 'footer_copyright', 'footer_contact_email', 'footer_bottom_links'])

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
      site_logo_url: (map['site_logo_url'] as string | null) ?? null,
      footer_tagline: parse<string>(map['footer_tagline'], DEFAULTS.footer_tagline),
      footer_columns: parse<FooterColumn[]>(map['footer_columns'], DEFAULTS.footer_columns),
      footer_social: parse<FooterSettings['footer_social']>(map['footer_social'], DEFAULTS.footer_social),
      footer_copyright: parse<string>(map['footer_copyright'], DEFAULTS.footer_copyright),
      footer_contact_email: parse<string>(map['footer_contact_email'], DEFAULTS.footer_contact_email),
      footer_bottom_links: parse<{ label: string; url: string }[]>(map['footer_bottom_links'], DEFAULTS.footer_bottom_links),
    }
  } catch {
    return DEFAULTS
  }
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📸',
  twitter: '🐦',
  facebook: '👍',
  youtube: '▶️',
  tiktok: '🎵',
  whatsapp: '💬',
}

export default async function Footer() {
  const settings = await getFooterData()
  const year = new Date().getFullYear()
  const copyright = settings.footer_copyright.replace('{year}', String(year))
  const socialEntries = Object.entries(settings.footer_social).filter(([, v]) => v)

  return (
    <footer className="relative bg-slate-950 text-slate-400 overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-700/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── MAIN FOOTER BODY ──────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand — spans 2 cols on lg */}
          <div className="sm:col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 group-hover:from-indigo-400 group-hover:to-indigo-600 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-900/50">
                <span className="text-white font-black text-base tracking-tight">G</span>
              </div>
              <span className="text-xl font-black text-white tracking-tight">Gospello</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {settings.footer_tagline}
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">🇳🇬 Nigeria</span>
              <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">⛪ Churches</span>
              <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">🙏 Est. 2025</span>
            </div>

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 px-2.5 py-1 rounded-full transition-colors capitalize"
                  >
                    <span>{SOCIAL_ICONS[platform] ?? '🔗'}</span>
                    {platform}
                  </a>
                ))}
              </div>
            )}

            {/* CTA */}
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 mt-6 bg-amber-400 hover:bg-amber-300 text-gray-900 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 hover:-translate-y-0.5"
            >
              Post an Event →
            </Link>
          </div>

          {/* Dynamic columns */}
          {settings.footer_columns.slice(0, 2).map((col) => (
            <div key={col.heading}>
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">{col.heading}</h3>
              <ul className="space-y-1">
                {col.links.map((link) => (
                  <li key={link.url + link.label}>
                    <Link
                      href={link.url}
                      className="block text-sm text-slate-400 hover:text-white py-1.5 transition-colors hover:translate-x-0.5 transform duration-150"
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
      <div className="relative border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-slate-600">{copyright}</p>
            <div className="flex items-center gap-4">
              {settings.footer_bottom_links.map((lnk, i) => (
                <span key={lnk.url + i} className="flex items-center gap-4">
                  {i > 0 && <span className="text-slate-700">·</span>}
                  <Link href={lnk.url} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
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
