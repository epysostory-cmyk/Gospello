'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from 'lucide-react'

interface Props {
  basePath?: string
}

export default function NearMeButton({ basePath = '/churches' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const addr = data.address ?? {}
          // Nigerian states come back as state or state_district
          const state: string =
            addr.state ?? addr.state_district ?? addr.county ?? ''
          if (state) {
            router.push(`${basePath}?state=${encodeURIComponent(state)}`)
          } else {
            setError('Could not detect your state')
          }
        } catch {
          setError('Location lookup failed')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location access denied')
        setLoading(false)
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleNearMe}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60"
        style={{ background: 'rgba(255,255,255,0.10)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <Navigation className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Detecting…' : 'Near Me'}
      </button>
      {error && <p className="text-[11px] text-red-400 pl-1">{error}</p>}
    </div>
  )
}
