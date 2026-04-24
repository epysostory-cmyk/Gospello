export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Save } from 'lucide-react'
import { getTermsContent, saveTermsContent } from './actions'

export default async function AdminTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const params = await searchParams
  const saved = params.saved === '1'
  const { content, last_updated } = await getTermsContent()

  const INPUT_CLS = 'w-full bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-600'

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/admin/settings" className="hover:text-gray-300 transition-colors">Settings</Link>
          {' / '}
          <span className="text-gray-300">Terms of Use</span>
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">Terms of Use</h1>
        <p className="text-gray-400 text-sm mt-0.5">Edit the content shown at /terms</p>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Terms of Use saved successfully.
        </div>
      )}

      <form action={saveTermsContent} className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Content</h2>
          <p className="text-xs text-gray-500">
            Use ## for section headings and **text** for bold. Leave empty to use the default content.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Last Updated</label>
            <input type="text" name="last_updated" defaultValue={last_updated}
              placeholder="e.g. April 2026" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Terms Content (Markdown-lite: ## heading, **bold**)
            </label>
            <textarea name="content" rows={30} defaultValue={content}
              placeholder="Leave blank to use default content..."
              className={INPUT_CLS + ' resize-y font-mono text-xs leading-relaxed'} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/terms" target="_blank" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Preview /terms →
          </Link>
          <button type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
            <Save className="w-4 h-4" />
            Save Terms of Use
          </button>
        </div>
      </form>
    </div>
  )
}
