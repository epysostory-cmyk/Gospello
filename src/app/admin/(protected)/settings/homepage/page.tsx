export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getHomepageCtaSettings } from './actions'
import HomepageCtaEditor from './HomepageCtaEditor'

export default async function AdminHomepageSettingsPage() {
  const initial = await getHomepageCtaSettings()

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-700 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-700">Homepage</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Homepage Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customize the church CTA section on the homepage</p>
        </div>
        <Link href="/" target="_blank" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Preview Homepage →
        </Link>
      </div>

      <HomepageCtaEditor initial={initial} />
    </div>
  )
}
