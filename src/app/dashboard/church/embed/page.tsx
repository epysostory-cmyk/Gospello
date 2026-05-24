export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Church } from '@/types/database'
import BackButton from '@/components/ui/BackButton'
import EmbedPageClient from './EmbedPageClient'

export default async function ChurchEmbedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('churches')
    .select('slug, name')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!data) redirect('/dashboard/church/setup')

  const church = data as Pick<Church, 'slug' | 'name'>
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const embedUrl = `${siteUrl}/embed/${church.slug}`
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="480"\n  frameborder="0"\n  style="border-radius:12px;border:1px solid #e5e7eb;"\n  title="${church.name} — Upcoming Events"\n></iframe>`

  return (
    <div className="max-w-2xl space-y-6">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Embed on your website</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Your upcoming events, live on your website. Post once on Gospello — it updates everywhere automatically.
        </p>
      </div>

      <EmbedPageClient
        embedUrl={embedUrl}
        iframeCode={iframeCode}
        churchName={church.name}
      />
    </div>
  )
}
