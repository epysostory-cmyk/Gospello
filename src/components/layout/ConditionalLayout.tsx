'use client'

import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
  navbar: React.ReactNode
  footer: React.ReactNode
}

export default function ConditionalLayout({ children, navbar, footer }: Props) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  )
}
