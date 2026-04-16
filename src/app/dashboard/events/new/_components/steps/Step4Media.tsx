'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'event-banners')
  body.append('folder', folder)

  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()

  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}

export default function Step4Media({ formData, updateForm, errors }: StepProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')

    try {
      const url = await uploadFile(file, 'event-banners')
      updateForm('banner_url', url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (formData.gallery_urls.length + files.length > 5) {
      setUploadError('Maximum 5 gallery images allowed')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const newUrls = await Promise.all(
        files.map((f) => uploadFile(f, 'event-banners/gallery'))
      )
      updateForm('gallery_urls', [...formData.gallery_urls, ...newUrls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const removeGalleryImage = (index: number) => {
    updateForm('gallery_urls', formData.gallery_urls.filter((_: string, i: number) => i !== index))
  }

  return (
    <div className="bg-white rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Media</h3>

      {/* Banner Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>

        {formData.banner_url ? (
          <div className="space-y-3">
            <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={formData.banner_url}
                alt="Banner preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                updateForm('banner_url', '')
                if (bannerInputRef.current) bannerInputRef.current.value = ''
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Change Banner
            </button>
          </div>
        ) : (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm text-indigo-600 font-medium">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Click to upload banner</span>
                  <span className="text-xs text-gray-500">PNG, JPG, GIF, WebP · max 10 MB</span>
                </>
              )}
            </button>
          </>
        )}
        {errors.banner_url && <p className="text-red-600 text-xs mt-2">{errors.banner_url}</p>}
      </div>

      {/* Gallery Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gallery Images <span className="text-gray-500 text-xs">({formData.gallery_urls.length}/5)</span>
        </label>

        {formData.gallery_urls.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {formData.gallery_urls.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.gallery_urls.length < 5 && (
          <>
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleGalleryUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading || formData.gallery_urls.length >= 5}
              className="w-full py-6 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm text-indigo-600 font-medium">Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Add gallery images</span>
                  <span className="text-xs text-gray-500">Up to 5 images</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <p className="text-sm text-indigo-800">
          💡 <strong>Tip:</strong> Use a high-quality banner image that represents your event. Gallery images help attendees learn more.
        </p>
      </div>
    </div>
  )
}
