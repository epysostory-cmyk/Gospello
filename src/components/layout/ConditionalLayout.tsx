'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'

interface Props {
  children: React.ReactNode
  logoUrl?: string | null
  siteName?: string
}

export default function ConditionalLayout({ children, logoUrl, siteName }: Props) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar logoUrl={logoUrl} siteName={siteName} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
