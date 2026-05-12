import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import ScrollToTop from '@/components/ui/ScrollToTop'
import SavedEventsMigrator from '@/components/SavedEventsMigrator'
import { getSiteSettings } from '@/app/actions/site-settings'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-playfair',
})

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gospello | Gospel Events, Churches & Organizers in Nigeria',
    template: '%s | Gospello',
  },
  description:
    'Find gospel events, churches and organizers across Nigeria — worship nights, conferences, prayer gatherings and more.',
  keywords: ['christian events', 'church events', 'lagos', 'nigeria', 'worship', 'prayer', 'conference'],
  verification: {
    google: 'Au2OSU7tCEpEq0THkVnQy7eaTyBjhTttXgro1gJA4yw',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'Gospello',
    url: siteUrl,
    title: 'Gospello | Gospel Events, Churches & Organizers in Nigeria',
    description: 'Find gospel events, churches and organizers across Nigeria — worship nights, conferences, prayer gatherings and more.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Gospello | Gospel Events, Churches & Organizers in Nigeria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gospello | Gospel Events, Churches & Organizers in Nigeria',
    description: 'Find gospel events, churches and organizers across Nigeria — worship nights, conferences, prayer gatherings and more.',
    images: ['/twitter-image'],
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
      <body className={`min-h-full flex flex-col bg-white ${inter.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable}`}>
        <ScrollToTop />
        <SavedEventsMigrator />
        <ConditionalLayout
          navbar={<Navbar logoUrl={settings.site_logo_url} siteName={settings.site_name} />}
          footer={<Footer />}
        >
          {children}
        </ConditionalLayout>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-312DVPG9JK" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-312DVPG9JK');
      `}</Script>
      </body>
    </html>
  )
}
