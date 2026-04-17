'use client'

import { Download } from 'lucide-react'

interface Registration {
  ticket_number: number
  full_name: string
  email: string
  created_at: string
  registration_type: string
  paid_confirmed: boolean | null
}

interface Props {
  registrations: Registration[]
  eventSlug: string
}

function paymentStatus(reg: Registration): string {
  if (reg.registration_type === 'paid') {
    return reg.paid_confirmed ? 'Payment Confirmed' : 'Awaiting Payment'
  }
  return 'Registered'
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export default function ExportCSVButton({ registrations, eventSlug }: Props) {
  const handleExport = () => {
    const headers = ['Ticket #', 'Full Name', 'Email', 'Registration Date', 'Payment Status']
    const rows = registrations.map(reg => [
      `#${String(reg.ticket_number).padStart(4, '0')}`,
      reg.full_name,
      reg.email,
      new Date(reg.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      paymentStatus(reg),
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gospello-${eventSlug}-registrations.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  )
}
