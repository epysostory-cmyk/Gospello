'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { X, Loader2 } from 'lucide-react'

interface Props {
  imageSrc: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await createImage(imageSrc)
  const outputSize = Math.max(400, pixelCrop.width, pixelCrop.height)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')!

  ctx.beginPath()
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob!], 'photo.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.85,
    )
  })
}

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    const file = await getCroppedImg(imageSrc, croppedAreaPixels)
    setProcessing(false)
    onConfirm(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Adjust your photo</h2>
            <p className="text-xs text-gray-500 mt-0.5">Drag and pinch to position</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-gray-900" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              cropAreaStyle: { border: '3px solid white', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 pt-4 pb-2">
          <label className="text-xs text-gray-500 mb-1.5 block">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1×</span>
            <span>3×</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 px-5 pb-5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {processing ? 'Processing…' : 'Use This Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
