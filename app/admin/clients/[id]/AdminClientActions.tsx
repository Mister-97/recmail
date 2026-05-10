'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle2, AlertCircle, Search, Phone, KeyRound, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  clientId: string
  initialPlan: string
  initialStatus: string
  initialNotes: string
  initialMrr: number
  initialBusinessName: string
  initialPrompt: string
  initialTwilioNumber: string
}

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

export default function AdminClientActions({
  clientId, initialPlan, initialStatus, initialNotes,
  initialMrr, initialBusinessName, initialPrompt, initialTwilioNumber,
}: Props) {
  const router = useRouter()

  // Account settings
  const [plan, setPlan] = useState(initialPlan || 'starter')
  const [planStatus, setPlanStatus] = useState(initialStatus || 'trial')
  const [notes, setNotes] = useState(initialNotes || '')
  const [mrr, setMrr] = useState(String(initialMrr || 0))
  const [businessName, setBusinessName] = useState(initialBusinessName || '')
  const [saving, setSaving] = useState(false)

  // AI prompt
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [savingPrompt, setSavingPrompt] = useState(false)

  // Twilio provision
  const [twilioNumber, setTwilioNumber] = useState(initialTwilioNumber || '')
  const [areaCode, setAreaCode] = useState('')
  const [searchResults, setSearchResults] = useState<{ phone: string; locality: string; region: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [provisioning, setProvisioning] = useState(false)

  // Password reset
  const [resetting, setResetting] = useState(false)
  const [resetLink, setResetLink] = useState('')

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
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
      showToast('Saved')
      router.refresh()
    } catch {
      showToast('Failed to save', false)
    } finally {
      setSaving(false)
    }
  }

  async function savePrompt() {
    setSavingPrompt(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_prompt_override: prompt }),
      })
      if (!res.ok) throw new Error()
      showToast('AI prompt saved')
      router.refresh()
    } catch {
      showToast('Failed to save prompt', false)
    } finally {
      setSavingPrompt(false)
    }
  }

  async function searchNumbers() {
    if (!areaCode.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/provision?area_code=${areaCode}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSearchResults(data.numbers ?? [])
      if ((data.numbers ?? []).length === 0) showToast('No numbers found for that area code', false)
    } catch (err: any) {
      showToast(err.message || 'Search failed', false)
    } finally {
      setSearching(false)
    }
  }

  async function provision(phone: string) {
    setProvisioning(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTwilioNumber(data.phone_number)
      setSearchResults([])
      showToast(`Provisioned ${data.phone_number}`)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Provision failed', false)
    } finally {
      setProvisioning(false)
    }
  }

  async function sendPasswordReset() {
    setResetting(true)
    setResetLink('')
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/password-reset`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`Reset email sent to ${data.email}`)
      if (data.link) setResetLink(data.link)
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset', false)
    } finally {
      setResetting(false)
    }
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
  const labelCls = "text-xs font-semibold text-gray-500 block mb-1.5"

  return (
    <div className="space-y-4">
      {/* Account Settings */}
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
        </div>
      </div>

      {/* AI Prompt */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h2 className="text-sm font-bold text-gray-900">AI Receptionist Prompt</h2>
          </div>
          <button onClick={savePrompt} disabled={savingPrompt}
            className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <Save className="w-3.5 h-3.5" />
            {savingPrompt ? 'Saving…' : 'Save Prompt'}
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={6}
          placeholder="Leave blank to use the default system prompt. Override here to customize the AI's tone, industry knowledge, services offered, pricing, and how it should qualify leads for this specific business."
          className={`${inputCls} resize-none font-mono text-xs`}
        />
        <p className="text-[10px] text-gray-400 mt-1.5">This overrides the default AI prompt entirely for this client. Be specific about their services, pricing, and how to qualify leads.</p>
      </div>

      {/* Twilio Provision */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-gray-900">Twilio Number</h2>
          {twilioNumber && (
            <span className="font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{twilioNumber}</span>
          )}
        </div>

        {!twilioNumber ? (
          <>
            <p className="text-xs text-gray-400 mb-3">Search for an available number by area code and provision it for this client.</p>
            <div className="flex gap-2">
              <input
                value={areaCode}
                onChange={e => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="Area code (e.g. 469)"
                maxLength={3}
                className={`${inputCls} max-w-[160px]`}
              />
              <button onClick={searchNumbers} disabled={searching || areaCode.length !== 3}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                <Search className="w-3.5 h-3.5" />
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {searchResults.map(n => (
                  <div key={n.phone} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                    <div>
                      <span className="font-mono text-sm text-gray-800">{n.phone}</span>
                      <span className="text-xs text-gray-400 ml-2">{n.locality}, {n.region}</span>
                    </div>
                    <button onClick={() => provision(n.phone)} disabled={provisioning}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">
                      {provisioning ? 'Provisioning…' : 'Provision'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">Number is provisioned. To change it, release the current number from the Twilio console first.</p>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Account Access</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">Send a password reset email to the client's account owner if they're locked out or lost access.</p>
        <button onClick={sendPasswordReset} disabled={resetting}
          className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <KeyRound className="w-3.5 h-3.5" />
          {resetting ? 'Sending…' : 'Send Password Reset Email'}
        </button>
        {resetLink && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl">
            <p className="text-[10px] text-blue-600 font-semibold mb-1">Reset link (valid 1 hour):</p>
            <p className="text-[10px] font-mono text-blue-800 break-all">{resetLink}</p>
          </div>
        )}
      </div>

      {/* Internal Notes */}
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
