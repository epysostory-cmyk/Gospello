export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Gospello',
  description: 'Privacy Policy for Gospello — Nigeria\'s gospel event discovery platform.',
}

const DEFAULT_PRIVACY = `
## 1. Information We Collect

We collect information you provide directly to us when you create an account, post events, or contact us. This includes:

- **Account Information:** Name, email address, password, and account type (church or organizer).
- **Profile Information:** Church name, ministry description, logo, website, social media handles, and location.
- **Event Information:** Event titles, descriptions, dates, locations, and media uploads.
- **Usage Data:** Pages visited, search queries, events viewed, and attendance records.
- **Device Information:** IP address, browser type, and operating system.

## 2. How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve the Gospello platform.
- Process event submissions and notify you of approvals or rejections.
- Send you transactional emails related to your events and account.
- Personalize your experience and show you relevant events near you.
- Detect and prevent fraudulent or abusive activity.
- Comply with legal obligations.

We do not sell your personal information to third parties.

## 3. Information Sharing

We may share your information with:

- **Other Users:** Your public profile, event listings, and church/organizer details are visible to all visitors.
- **Service Providers:** Trusted third-party services that assist us in operating the platform (e.g., Supabase for database, Vercel for hosting).
- **Legal Requirements:** We may disclose information if required by law or to protect the rights and safety of our users.

## 4. Data Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit using TLS and stored securely in Supabase.

## 5. Cookies

We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you interact with our platform. You may disable cookies in your browser settings, but some features may not function correctly.

## 6. Your Rights

You have the right to:

- **Access:** Request a copy of the personal data we hold about you.
- **Correction:** Ask us to correct inaccurate or incomplete data.
- **Deletion:** Request that we delete your account and associated data.
- **Portability:** Receive your data in a structured, machine-readable format.

To exercise these rights, contact us at the email below.

## 7. Data Retention

We retain your data as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal information within 30 days, except where retention is required by law.

## 8. Children's Privacy

Gospello is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.

## 10. Contact Us

If you have questions about this Privacy Policy, please contact us at:

**Email:** hello@gospello.com

**Gospello**
Lagos, Nigeria
`

export default async function PrivacyPage() {
  let content = DEFAULT_PRIVACY
  let lastUpdated = 'April 2026'

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('value')
      .eq('key', 'privacy_policy_content')
      .maybeSingle()

    if (data?.value && data.value !== 'null') {
      const parsed = data.value as { content?: string; last_updated?: string }
      if (parsed?.content) content = parsed.content
      if (parsed?.last_updated) lastUpdated = parsed.last_updated
    }
  } catch {
    // use defaults
  }

  // Simple markdown-like renderer
  const lines = content.split('\n')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-16">
        <p className="text-sm text-gray-400 mb-4">Last updated: {lastUpdated}</p>
        <h1 className="text-[28px] font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose-content" style={{ color: '#374151', lineHeight: '1.8', fontSize: '16px' }}>
          {lines.map((line, i) => {
            const trimmed = line.trim()
            if (trimmed.startsWith('## ')) {
              return <h2 key={i} style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '2rem', marginBottom: '0.75rem' }}>{trimmed.slice(3)}</h2>
            }
            if (trimmed === '') return <br key={i} />
            // Handle bold
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
