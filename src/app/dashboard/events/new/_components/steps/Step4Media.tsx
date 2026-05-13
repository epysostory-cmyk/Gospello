'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface StepProps {
  formData: any
  updateForm: (field: string, value: any) => void
  errors: Record<string, string>
}

async function uploadFile(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', 'event-banners')
  body.append('folder', 'event-banners')
  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}

export default function Step4Media({ formData, updateForm, errors }: StepProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadFile(file)
      updateForm('banner_url', url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1.5">
          Event flyer / banner <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">Upload your event flyer or a banner image. This is the first thing people see.</p>

        {formData.banner_url ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
              <Image src={formData.banner_url} alt="Event flyer" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => { updateForm('banner_url', ''); if (inputRef.current) inputRef.current.value = '' }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Change image
            </button>
          </div>
        ) : (
          <>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full py-10 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-60 bg-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Uploading...</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-gray-700">Tap to upload image</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WebP — max 2 MB</span>
                </>
              )}
            </button>
          </>
        )}

        {errors.banner_url && <p className="text-red-500 text-xs mt-2">{errors.banner_url}</p>}
        {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
      </div>
    </div>
  )
}
