'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, CheckCircle2, AlertCircle, Shield, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Admin {
  user_id: string
  email: string
  is_super_admin: boolean
  created_at: string
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

export default function TeamActions({ admins, isSuperAdmin }: { admins: Admin[]; isSuperAdmin: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function addAdmin() {
    if (!email.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmail('')
      showToast(`${data.email} added as admin`)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to add admin', false)
    } finally {
      setAdding(false)
    }
  }

  async function removeAdmin(userId: string, adminEmail: string) {
    if (!confirm(`Remove ${adminEmail} from the team? They will lose portal access immediately.`)) return
    setRemoving(userId)
    try {
      const res = await fetch(`/api/admin/team/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`${adminEmail} removed`)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', false)
    } finally {
      setRemoving(null)
    }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Team list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Team Members</h2>
          <p className="text-xs text-gray-400 mt-0.5">{admins.length} member{admins.length !== 1 ? 's' : ''} with portal access</p>
        </div>
        <div className="divide-y divide-gray-50">
          {admins.map(a => (
            <div key={a.user_id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {a.email.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{a.email}</p>
                    {a.is_super_admin ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Super Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Added {fmtDate(a.created_at)}</p>
                </div>
              </div>
              {isSuperAdmin && !a.is_super_admin && (
                <button
                  onClick={() => removeAdmin(a.user_id, a.email)}
                  disabled={removing === a.user_id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {removing === a.user_id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add admin */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">Add Team Member</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">The person must already have a RecMail account. They'll get full portal access immediately.</p>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAdmin()}
              placeholder="teammate@company.com"
              type="email"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            />
            <button
              onClick={addAdmin}
              disabled={adding || !email.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Note: New admins get regular access. Only you can manage team membership.
          </p>
        </div>
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
