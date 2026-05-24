export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/ui/BackButton'
import OrganizerEmbedClient from './OrganizerEmbedClient'

export default async function OrganizerEmbedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.account_type !== 'organizer') redirect('/dashboard')

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gospello.com').trim()
  const embedUrl = `${siteUrl}/embed/organizer/${user.id}`
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="480"\n  frameborder="0"\n  style="border-radius:12px;border:1px solid #e5e7eb;"\n  title="${profile.display_name} — Upcoming Events"\n></iframe>`

  return (
    <div className="max-w-2xl space-y-6">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Embed on your website</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Your upcoming events, live on your website. Post once on Gospello — it updates everywhere automatically.
        </p>
      </div>

      <OrganizerEmbedClient
        embedUrl={embedUrl}
        iframeCode={iframeCode}
        displayName={profile.display_name}
      />
    </div>
  )
}
