'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50',
      ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  )
}

export default function AdminConversationActions({
  conversationId,
  currentStatus,
}: {
  conversationId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function sendSms() {
    if (!body.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setBody('')
      showToast('SMS sent')
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to send', false)
    } finally {
      setSending(false)
    }
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      showToast(`Marked as ${status}`)
      router.refresh()
    } catch {
      showToast('Failed to update status', false)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Manual SMS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-900 mb-2">Send Manual SMS</p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          placeholder="Type a message to send on behalf of this client..."
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all resize-none"
        />
        <button
          onClick={sendSms}
          disabled={sending || !body.trim()}
          className="mt-2 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Sending…' : 'Send SMS'}
        </button>
      </div>

      {/* Status override */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-900 mb-2">Override Status</p>
        <div className="flex gap-2">
          {['open', 'qualified', 'closed'].filter(s => s !== currentStatus).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updatingStatus}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-xl capitalize border transition-colors disabled:opacity-50',
                s === 'qualified' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' :
                s === 'closed' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' :
                'border-blue-200 text-blue-700 hover:bg-blue-50'
              )}
            >
              <XCircle className="w-3 h-3 inline mr-1" />
              Mark {s}
            </button>
          ))}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
