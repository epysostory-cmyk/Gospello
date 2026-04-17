import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import ScrollToTop from '@/components/ui/ScrollToTop'
import { getSiteSettings } from '@/app/actions/site-settings'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gospello — Discover Christian Events Near You',
    template: '%s | Gospello',
  },
  description:
    'Discover Christian events, churches, and spiritual gatherings happening near you. Lagos-first, globally accessible.',
  keywords: ['christian events', 'church events', 'lagos', 'nigeria', 'worship', 'prayer', 'conference'],
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'Gospello',
    url: siteUrl,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Dynamic favicon — uses DB value when set, otherwise falls back to /favicon.ico */}
        <link rel="icon" href={settings.site_favicon_url ?? '/favicon.ico'} sizes="any" />
        <link rel="apple-touch-icon" href={settings.site_favicon_url ?? '/favicon.ico'} />
      </head>
      <body className={`min-h-full flex flex-col bg-gray-50 ${plusJakartaSans.variable}`}>
        <ScrollToTop />
        <ConditionalLayout
          navbar={<Navbar logoUrl={settings.site_logo_url} siteName={settings.site_name} />}
          footer={<Footer />}
        >
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
}
