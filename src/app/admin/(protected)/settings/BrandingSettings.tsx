'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react'
import { updateSiteSetting } from '@/app/actions/site-settings'

interface Props {
  initialLogoUrl: string | null
  initialFaviconUrl: string | null
}

async function uploadBrandingFile(file: File, type: 'logo' | 'favicon'): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'site-assets')
  body.append('folder', type)
  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}

export default function BrandingSettings({ initialLogoUrl, initialFaviconUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(initialFaviconUrl)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [savedLogo, setSavedLogo] = useState(false)
  const [savedFavicon, setSavedFavicon] = useState(false)
  const [error, setError] = useState('')

  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError('')
    setSavedLogo(false)
    try {
      const url = await uploadBrandingFile(file, 'logo')
      await updateSiteSetting('site_logo_url', url)
      setLogoUrl(url)
      setSavedLogo(true)
      setTimeout(() => setSavedLogo(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    setError('')
    setSavedFavicon(false)
    try {
      const url = await uploadBrandingFile(file, 'favicon')
      await updateSiteSetting('site_favicon_url', url)
      setFaviconUrl(url)
      setSavedFavicon(true)
      setTimeout(() => setSavedFavicon(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFavicon(false)
      if (faviconRef.current) faviconRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <ImageIcon className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Branding</h2>
      </div>

      <div className="px-5 py-5 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Logo */}
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logoUrl ? (
              <Image src={logoUrl} alt="Site logo" width={64} height={64} className="object-contain w-full h-full p-1" />
            ) : (
              <span className="text-2xl font-black text-indigo-400">G</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">Site Logo</p>
            <p className="text-xs text-gray-500 mb-3">
              Shows in the navbar. Use a PNG or SVG with transparent background.
              Recommended: 200×60 px.
            </p>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
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

        <div className="border-t border-white/10" />

        {/* Favicon */}
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {faviconUrl ? (
              <Image src={faviconUrl} alt="Favicon" width={32} height={32} className="object-contain" />
            ) : (
              <span className="text-xs text-gray-500">No icon</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">Favicon</p>
            <p className="text-xs text-gray-500 mb-3">
              Shows in browser tabs and bookmarks. Use a square PNG or ICO.
              Recommended: 512×512 px (or 32×32 minimum).
            </p>
            <input
              ref={faviconRef}
              type="file"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFaviconUpload}
            />
            <button
              onClick={() => faviconRef.current?.click()}
              disabled={uploadingFavicon}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {uploadingFavicon ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              ) : savedFavicon ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : (
                <><Upload className="w-4 h-4" /> {faviconUrl ? 'Change Favicon' : 'Upload Favicon'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
