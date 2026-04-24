export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getFooterSettings } from './actions'
import FooterEditor from './FooterEditor'

export default async function FooterSettingsPage() {
  const initial = await getFooterSettings()

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/admin/settings" className="hover:text-gray-700 transition-colors">Settings</Link>
            {' / '}
            <span className="text-gray-700">Footer</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Footer Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Customize the footer that appears on every page</p>
        </div>
        <Link href="/" target="_blank" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Preview Site →
        </Link>
      </div>

      <FooterEditor initial={initial} />
    </div>
  )
}
