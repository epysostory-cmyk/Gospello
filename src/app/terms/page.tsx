export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import BackButton from '@/components/ui/BackButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Gospello',
  description: 'Terms of Use for Gospello — Nigeria\'s gospel event discovery platform.',
}

const DEFAULT_TERMS = `
## 1. Acceptance of Terms

By accessing or using the Gospello platform ("Service"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Service. Gospello reserves the right to modify these terms at any time; your continued use of the Service constitutes acceptance of any changes.

## 2. Use of Platform

Gospello is a platform for discovering, listing, and promoting Christian events in Nigeria and beyond. You may use the platform to:

- Browse and discover church events and spiritual gatherings.
- Create and manage an account to post events.
- Claim and manage your church or ministry profile.
- Connect with churches and organizers.

You agree to use the platform only for lawful purposes and in accordance with these Terms.

## 3. Event Listings

When you submit an event to Gospello:

- You represent that the event information is accurate and not misleading.
- You grant Gospello a non-exclusive license to display, promote, and share your event on the platform and through marketing channels.
- All events are subject to review and approval by the Gospello moderation team.
- Gospello reserves the right to reject or remove any event that violates our policies.
- You are solely responsible for the accuracy of event details, including dates, locations, and registration information.

## 4. User Accounts

To post events or claim a church profile, you must create an account. You are responsible for:

- Maintaining the confidentiality of your account credentials.
- All activities that occur under your account.
- Providing accurate and up-to-date profile information.

You must notify us immediately of any unauthorized use of your account at hello@gospello.com.

## 5. Prohibited Content

You may not post, upload, or share content that:

- Is false, misleading, or deceptive.
- Promotes harmful, abusive, or discriminatory content.
- Infringes on the intellectual property rights of others.
- Contains malware, viruses, or harmful code.
- Violates any applicable laws or regulations.
- Is unrelated to Christian events or faith-based activities.

Gospello reserves the right to remove prohibited content and suspend accounts that violate these terms.

## 6. Intellectual Property

All content on the Gospello platform, including logos, design, text, and software, is the property of Gospello or its licensors. You may not reproduce, distribute, or create derivative works from our content without written permission.

You retain ownership of content you upload (event banners, church logos, descriptions). By uploading content, you grant Gospello a worldwide, royalty-free license to use, display, and distribute that content in connection with the Service.

## 7. Disclaimer of Warranties

The Service is provided "as is" without warranties of any kind, either express or implied. Gospello does not warrant that:

- The Service will be uninterrupted or error-free.
- Event information provided by third parties is accurate.
- The platform will meet your specific requirements.

## 8. Limitation of Liability

To the fullest extent permitted by law, Gospello shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, even if we have been advised of the possibility of such damages.

## 9. Third-Party Links

The platform may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.

## 10. Changes to Terms

We may revise these Terms of Use at any time. We will post the revised terms on this page and update the "Last updated" date. Your continued use of the Service after changes constitutes your acceptance of the new terms.

## 11. Governing Law

These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of Nigerian courts.

## 12. Contact Us

For questions about these Terms of Use, please contact us at:

**Email:** hello@gospello.com

**Gospello**
Lagos, Nigeria
`

export default async function TermsPage() {
  let content = DEFAULT_TERMS
  let lastUpdated = 'April 2026'

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'terms_content')
      .maybeSingle()

    if (data?.value && data.value !== 'null') {
      const parsed = data.value as { content?: string; last_updated?: string }
      if (parsed?.content) content = parsed.content
      if (parsed?.last_updated) lastUpdated = parsed.last_updated
    }
  } catch {
    // use defaults
  }

  const lines = content.split('\n')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <BackButton />
        <p className="text-sm text-gray-400 mb-4">Last updated: {lastUpdated}</p>
        <h1 className="text-[28px] font-bold text-gray-900 mb-8">Terms of Use</h1>
        <div style={{ color: '#374151', lineHeight: '1.8', fontSize: '16px' }}>
          {lines.map((line, i) => {
            const trimmed = line.trim()
            if (trimmed.startsWith('## ')) {
              return <h2 key={i} style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '2rem', marginBottom: '0.75rem' }}>{trimmed.slice(3)}</h2>
            }
            if (trimmed === '') return <br key={i} />
            const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
            return (
              <p key={i} style={{ marginBottom: '0.5rem' }}>
                {parts.map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j}>{part.slice(2, -2)}</strong>
                    : <span key={j}>{part}</span>
                )}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}
