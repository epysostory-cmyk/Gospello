import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
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
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
