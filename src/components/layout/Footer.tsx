import Link from 'next/link'

const EXPLORE_LINKS = [
  { label: 'Events',      href: '/events' },
  { label: 'Categories',  href: '/categories' },
  { label: 'Churches',    href: '/churches' },
  { label: 'Organizers',  href: '/organizers' },
]

const COMPANY_LINKS = [
  { label: 'About Us',    href: '/about' },
  { label: 'Contact Us',  href: '/contact' },
]

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 overflow-hidden">

      {/* Ambient glow — top-right */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-700/8 rounded-full blur-[100px] pointer-events-none" />

      {/* ── MAIN FOOTER BODY ──────────────────────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand — spans 2 cols on lg */}
          <div className="sm:col-span-2">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 bg-indigo-600 group-hover:bg-indigo-500 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-900/40">
                <span className="text-white font-black text-base">G</span>
              </div>
              <span className="text-xl font-black text-white">Gospello</span>
              {/* Live indicator */}
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Nigeria&apos;s home for Christian events — worship nights, conferences, prayer gatherings and more, across all 36 states and beyond.
            </p>

            <p className="text-xs text-slate-600 mt-3">Nigeria · Est. 2025</p>

            {/* CTA */}
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 mt-6 bg-amber-400 hover:bg-amber-300 text-gray-900 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 hover:-translate-y-0.5"
            >
              Post an Event →
            </Link>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Explore</h3>
            <ul className="space-y-1">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block text-sm text-slate-400 hover:text-white py-1.5 transition-colors hover:translate-x-0.5 transform duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Company</h3>
            <ul className="space-y-1">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block text-sm text-slate-400 hover:text-white py-1.5 transition-colors hover:translate-x-0.5 transform duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────────── */}
      <div className="relative border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-slate-600">
              © 2026 Gospello. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-700">·</span>
              <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}
