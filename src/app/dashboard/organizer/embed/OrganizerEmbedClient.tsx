'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Monitor, Smartphone } from 'lucide-react'

interface Props {
  embedUrl: string
  iframeCode: string
  displayName: string
}

export default function OrganizerEmbedClient({ embedUrl, iframeCode, displayName }: Props) {
  const [copied, setCopied] = useState(false)
  const [previewSize, setPreviewSize] = useState<'desktop' | 'mobile'>('desktop')

  function copyCode() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="space-y-8">

      {/* Step 1 */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">1. Copy this code</p>
        <p className="text-sm text-gray-500 mb-3">
          Paste it into any page on your website — WordPress, Wix, Squarespace, anything.
        </p>
        <div className="relative bg-gray-950 rounded-2xl overflow-hidden">
          <pre className="text-sm text-gray-300 p-4 pr-16 overflow-x-auto leading-relaxed whitespace-pre-wrap font-mono">
            {iframeCode}
          </pre>
          <button
            onClick={copyCode}
            className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">2. Paste it on your website</p>
        <div className="space-y-2">
          {[
            { platform: 'WordPress', instruction: 'Edit a page → Add block → Custom HTML → paste' },
            { platform: 'Wix', instruction: 'Add element → Embed → Custom Embed → paste' },
            { platform: 'Squarespace', instruction: 'Edit page → Add block → Code → paste' },
            { platform: 'Any other site', instruction: 'Find the HTML editor for your page and paste' },
          ].map(({ platform, instruction }) => (
            <div key={platform} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-gray-900">{platform}</span>
                <span className="text-sm text-gray-500"> — {instruction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3 — Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Preview</p>
            <p className="text-xs text-gray-400 mt-0.5">This is exactly what your visitors will see</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setPreviewSize('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewSize === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setPreviewSize('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                previewSize === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        <div className={`mx-auto transition-all duration-300 ${previewSize === 'mobile' ? 'max-w-[375px]' : 'max-w-full'}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="480"
            frameBorder="0"
            style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
            title={`${displayName} — Upcoming Events`}
          />
        </div>
      </div>

      <div className="pt-2 pb-4">
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open widget in new tab
        </a>
      </div>

    </div>
  )
}
