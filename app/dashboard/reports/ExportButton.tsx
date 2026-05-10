'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

export default function ExportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/export?client_id=${clientId}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recmail-leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
