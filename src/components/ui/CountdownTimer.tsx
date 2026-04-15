'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  startDate: string
}

export default function CountdownTimer({ startDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number } | null>(null)

  useEffect(() => {
    const compute = () => {
      const diff = new Date(startDate).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft(null); return }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft({ days, hours, mins })
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [startDate])

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium">
      <Clock className="w-4 h-4" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours}h {timeLeft.mins}m away
      </span>
    </div>
  )
}
