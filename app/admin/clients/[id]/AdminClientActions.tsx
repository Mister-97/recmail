'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  clientId: string
  initialPlan: string
  initialStatus: string
  initialNotes: string
  initialMrr: number
  initialBusinessName: string
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50 animate-in slide-in-from-bottom-4 duration-200',
      ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  )
}

export default function AdminClientActions({ clientId, initialPlan, initialStatus, initialNotes, initialMrr, initialBusinessName }: Props) {
  const router = useRouter()
  const [plan, setPlan] = useState(initialPlan || 'starter')
  const [planStatus, setPlanStatus] = useState(initialStatus || 'trial')
  const [notes, setNotes] = useState(initialNotes || '')
  const [mrr, setMrr] = useState(String(initialMrr || 0))
  const [businessName, setBusinessName] = useState(initialBusinessName || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, plan_status: planStatus, admin_notes: notes, mrr: Number(mrr), business_name: businessName }),
      })
      if (!res.ok) throw new Error()
      showToast('Saved successfully')
      router.refresh()
    } catch {
      showToast('Failed to save', false)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
  const labelCls = "text-xs font-semibold text-gray-500 block mb-1.5"

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Account Settings</h2>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div>
          <label className={labelCls}>Business name</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Account status</label>
            <select value={planStatus} onChange={e => setPlanStatus(e.target.value)} className={inputCls}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className={inputCls}>
              <option value="starter">Starter — $49/mo</option>
              <option value="growth">Growth — $99/mo</option>
              <option value="pro">Pro — $199/mo</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>MRR ($)</label>
          <input type="number" value={mrr} onChange={e => setMrr(e.target.value)} className={inputCls} placeholder="99" />
          <p className="text-[10px] text-gray-400 mt-1">Used for revenue tracking in the overview.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Internal Notes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          placeholder="Support notes, calls, issues, follow-ups... Only visible to RecMail team."
          className={`${inputCls} resize-none font-mono text-xs`}
        />
        <button onClick={save} disabled={saving}
          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save notes'}
        </button>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
