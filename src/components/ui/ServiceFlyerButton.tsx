'use client'

import { useState } from 'react'
import { Download, Share2, X, Loader2, Check, ImageIcon, Sparkles } from 'lucide-react'

interface Props {
  slug: string
  churchName: string
}

export default function ServiceFlyerButton({ slug, churchName }: Props) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState('')
  const [format, setFormat] = useState<'square' | 'story'>('square')
  const [dlState, setDlState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [sharing, setSharing] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const flyerUrl = `/api/churches/${slug}/service-flyer?format=${format}${theme.trim() ? `&theme=${encodeURIComponent(theme.trim())}` : ''}`
  const fileName = `${churchName.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'service-flyer'}-${format}.png`

  async function handleDownload() {
    setDlState('loading')
    try {
      const res = await fetch(flyerUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDlState('done')
      setTimeout(() => setDlState('idle'), 2500)
    } catch {
      window.open(flyerUrl, '_blank', 'noopener,noreferrer')
      setDlState('idle')
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const res = await fetch(flyerUrl)
      const blob = await res.blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${churchName} — Sunday Service` })
      } else {
        await handleDownload()
      }
    } catch { /* user cancelled */ }
    setSharing(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #4f46e5)', color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
      >
        <Sparkles className="w-4 h-4" />
        Generate Service Flyer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md bg-[#111827] rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <p className="text-white font-bold text-base">Service Flyer</p>
                <p className="text-white/40 text-xs mt-0.5">Share this Sunday&apos;s service with your community</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Week's theme input */}
            <div className="px-6 pt-5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2">
                This week&apos;s theme or message title
              </label>
              <input
                type="text"
                value={theme}
                onChange={e => { setTheme(e.target.value); setPreviewing(false) }}
                placeholder="e.g. Supernatural Sunday, Victory in Christ"
                maxLength={60}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
              <p className="text-white/25 text-[11px] mt-1.5">Optional — leave blank for a general service flyer</p>
            </div>

            {/* Format picker */}
            <div className="px-6 pt-5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Format</p>
              <div className="flex gap-3">
                {([
                  { value: 'square', label: 'Square', sub: 'WhatsApp · Facebook' },
                  { value: 'story',  label: 'Story',  sub: 'WhatsApp Status · IG' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFormat(opt.value); setPreviewing(false) }}
                    className="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all"
                    style={{
                      borderColor: format === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.08)',
                      background: format === opt.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="relative">
                      <div className="rounded-lg border-2" style={{
                        width: opt.value === 'square' ? 40 : 26,
                        height: opt.value === 'square' ? 40 : 46,
                        borderColor: format === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.2)',
                        background: format === opt.value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                      }} />
                      {format === opt.value && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7C3AED] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm text-center">{opt.label}</p>
                      <p className="text-white/40 text-[11px] text-center mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview button + preview */}
            <div className="px-6 pt-5">
              {!previewing ? (
                <button
                  onClick={() => setPreviewing(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ImageIcon className="w-4 h-4" />
                  Preview Flyer
                </button>
              ) : (
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Preview</p>
                  <div
                    className="w-full rounded-2xl overflow-hidden bg-[#0c1445] border border-white/10 flex items-center justify-center"
                    style={{ aspectRatio: format === 'square' ? '1/1' : '9/16', maxHeight: 280 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={flyerUrl}
                      src={flyerUrl}
                      alt="Service flyer preview"
                      className="w-full h-full object-cover"
                      style={{ maxHeight: 280 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-6 py-6 flex gap-3">
              <button
                onClick={handleDownload}
                disabled={dlState === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-70"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {dlState === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : dlState === 'done' ? (
                  <><Check className="w-4 h-4 text-emerald-400" /> Saved!</>
                ) : (
                  <><Download className="w-4 h-4" /> Download</>
                )}
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-70"
                style={{ background: '#7C3AED', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
              >
                {sharing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sharing...</>
                ) : (
                  <><Share2 className="w-4 h-4" /> Share</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
