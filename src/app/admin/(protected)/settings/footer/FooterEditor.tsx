'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Save, Loader2, GripVertical, Link2, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react'
import { saveFooterSettings } from './actions'
import type { FooterSettings, FooterColumn } from './actions'
import { updateSiteSetting } from '@/app/actions/site-settings'

interface Props {
  initial: FooterSettings
}

async function uploadLogoFile(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'site-assets')
  body.append('folder', 'logo')
  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}

export default function FooterEditor({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [tagline, setTagline] = useState(initial.footer_tagline)
  const [copyright, setCopyright] = useState(initial.footer_copyright)
  const [contactEmail, setContactEmail] = useState(initial.footer_contact_email)
  const [social, setSocial] = useState(initial.footer_social)
  const [columns, setColumns] = useState<FooterColumn[]>(initial.footer_columns)
  const [bottomLinks, setBottomLinks] = useState(initial.footer_bottom_links)

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.site_logo_url)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [savedLogo, setSavedLogo] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)

  const currentYear = new Date().getFullYear()

  const updateSocial = (k: keyof typeof social, v: string) => setSocial(s => ({ ...s, [k]: v }))

  // Columns helpers
  const addColumn = () => setColumns(c => [...c, { heading: 'New Column', links: [] }])
  const removeColumn = (i: number) => setColumns(c => c.filter((_, idx) => idx !== i))
  const updateColumnHeading = (i: number, v: string) => setColumns(c => c.map((col, idx) => idx === i ? { ...col, heading: v } : col))
  const addLink = (ci: number) => setColumns(c => c.map((col, idx) => idx === ci ? { ...col, links: [...col.links, { label: '', url: '' }] } : col))
  const removeLink = (ci: number, li: number) => setColumns(c => c.map((col, idx) => idx === ci ? { ...col, links: col.links.filter((_, lidx) => lidx !== li) } : col))
  const updateLink = (ci: number, li: number, field: 'label' | 'url', v: string) =>
    setColumns(c => c.map((col, ci2) => ci2 === ci ? { ...col, links: col.links.map((lnk, li2) => li2 === li ? { ...lnk, [field]: v } : lnk) } : col))

  // Bottom links
  const updateBottomLink = (i: number, field: 'label' | 'url', v: string) =>
    setBottomLinks(bl => bl.map((lnk, idx) => idx === i ? { ...lnk, [field]: v } : lnk))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setLogoError('')
    setSavedLogo(false)
    try {
      const url = await uploadLogoFile(file)
      await updateSiteSetting('site_logo_url', url)
      setLogoUrl(url)
      setSavedLogo(true)
      setTimeout(() => setSavedLogo(false), 3000)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('footer_columns_json', JSON.stringify(columns))
    fd.set('footer_bottom_links_json', JSON.stringify(bottomLinks))
    startTransition(async () => {
      await saveFooterSettings(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const inputCls = 'w-full bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-2.5 placeholder-gray-400'
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

  const previewCopyright = copyright.replace('{year}', String(currentYear))

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* ── LEFT: editor ── */}
      <div className="xl:col-span-3 space-y-5">

        {saved && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Footer settings saved successfully.
          </div>
        )}

        {/* ── Logo ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">Footer Logo</h2>
          </div>
          <p className="text-xs text-gray-500 -mt-1">Same logo shown in the top navbar. Upload a PNG or SVG with a transparent background.</p>

          {logoError && (
            <p className="text-xs text-red-500">{logoError}</p>
          )}

          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {logoUrl ? (
                <Image src={logoUrl} alt="Footer logo" width={64} height={64} className="object-contain w-full h-full p-1" />
              ) : (
                <span className="text-2xl font-black text-indigo-500">G</span>
              )}
            </div>

            <div className="flex-1">
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {uploadingLogo ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                ) : savedLogo ? (
                  <><CheckCircle className="w-4 h-4" /> Saved!</>
                ) : (
                  <><Upload className="w-4 h-4" /> {logoUrl ? 'Change Logo' : 'Upload Logo'}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Brand Tagline</h2>
          <div>
            <label className={labelCls}>Footer tagline</label>
            <textarea name="footer_tagline" rows={3} value={tagline}
              onChange={e => setTagline(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Columns */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Footer Columns</h2>
            <button type="button" onClick={addColumn}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add column
            </button>
          </div>
          <div className="space-y-4">
            {columns.map((col, ci) => (
              <div key={ci} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <input value={col.heading} onChange={e => updateColumnHeading(ci, e.target.value)}
                    placeholder="Column heading"
                    className="flex-1 bg-transparent border-b border-gray-300 text-sm font-semibold text-gray-900 focus:outline-none focus:border-indigo-500 pb-0.5" />
                  <button type="button" onClick={() => removeColumn(ci)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 pl-6">
                  {(col.links ?? []).map((lnk, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <input value={lnk.label} onChange={e => updateLink(ci, li, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 bg-white border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-gray-400" />
                      <input value={lnk.url} onChange={e => updateLink(ci, li, 'url', e.target.value)}
                        placeholder="/url"
                        className="flex-1 bg-white border border-gray-200 text-gray-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-gray-400" />
                      <button type="button" onClick={() => removeLink(ci, li)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addLink(ci)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                    <Plus className="w-3 h-3" /> Add link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Social Media Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['social_instagram', 'Instagram', 'https://instagram.com/gospello'],
              ['social_twitter', 'Twitter / X', 'https://twitter.com/gospello'],
              ['social_facebook', 'Facebook', 'https://facebook.com/gospello'],
              ['social_youtube', 'YouTube', 'https://youtube.com/@gospello'],
              ['social_tiktok', 'TikTok', 'https://tiktok.com/@gospello'],
              ['social_whatsapp', 'WhatsApp (link or number)', '+2348000000000'],
            ] as [string, string, string][]).map(([key, label, ph]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" name={key}
                    value={social[key.replace('social_', '') as keyof typeof social] ?? ''}
                    onChange={e => updateSocial(key.replace('social_', '') as keyof typeof social, e.target.value)}
                    placeholder={ph}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl pl-9 pr-4 py-2.5 placeholder-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright + contact + bottom links */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Bottom Bar</h2>
          <div>
            <label className={labelCls}>Copyright text (use {'{'+'year'+'}'} for auto year)</label>
            <input type="text" name="footer_copyright" value={copyright}
              onChange={e => setCopyright(e.target.value)} className={inputCls}
              placeholder="© {year} Gospello. All rights reserved." />
            {copyright.includes('{year}') && (
              <p className="text-xs text-gray-600 mt-1">Preview: {previewCopyright}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Contact email</label>
            <input type="email" name="footer_contact_email" value={contactEmail}
              onChange={e => setContactEmail(e.target.value)} className={inputCls}
              placeholder="hello@gospello.com" />
          </div>
          <div>
            <label className={labelCls}>Bottom links</label>
            <div className="space-y-2">
              {bottomLinks.map((lnk, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={lnk.label} onChange={e => updateBottomLink(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-400" />
                  <input value={lnk.url} onChange={e => updateBottomLink(i, 'url', e.target.value)}
                    placeholder="/url"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden inputs for JSON */}
        <input type="hidden" name="footer_columns_json" value={JSON.stringify(columns)} />
        <input type="hidden" name="footer_bottom_links_json" value={JSON.stringify(bottomLinks)} />

        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? 'Saving…' : 'Save Footer Settings'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: live preview ── */}
      <div className="xl:col-span-2">
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
          <div className="bg-slate-950 rounded-2xl overflow-hidden text-slate-400 p-6 space-y-5">
            {/* Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" width={32} height={32} className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">G</div>
                )}
                <span className="text-white font-black text-base">Gospello</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{tagline}</p>
            </div>

            {/* Social icons */}
            {Object.values(social).some(v => v) && (
              <div className="flex flex-wrap gap-2">
                {social.instagram && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">Instagram</span>}
                {social.twitter && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">Twitter/X</span>}
                {social.facebook && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">Facebook</span>}
                {social.youtube && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">YouTube</span>}
                {social.tiktok && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">TikTok</span>}
                {social.whatsapp && <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400">WhatsApp</span>}
              </div>
            )}

            {/* Columns */}
            <div className="grid grid-cols-2 gap-4">
              {columns.map((col, ci) => (
                <div key={ci}>
                  <p className="text-white font-bold text-xs uppercase tracking-wider mb-2">{col.heading}</p>
                  <ul className="space-y-1">
                    {(col.links ?? []).map((lnk, li) => (
                      <li key={li} className="text-xs text-slate-400">{lnk.label || '—'}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
              <p className="text-xs text-slate-600">{previewCopyright}</p>
              <div className="flex gap-3">
                {bottomLinks.map((lnk, i) => (
                  <span key={i} className="text-xs text-slate-600">{lnk.label}</span>
                ))}
              </div>
              {contactEmail && <p className="text-xs text-slate-600">{contactEmail}</p>}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
