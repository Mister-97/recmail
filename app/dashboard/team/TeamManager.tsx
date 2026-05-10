'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, Clock, CheckCircle2, AlertCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Member { id: string; email: string; role: string; full_name: string | null; created_at: string; isSelf: boolean }
interface PendingInvite { id: string; email: string; role: string; created_at: string; expires_at: string }

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn('fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50',
      ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  )
}

export default function TeamManager({ members, pendingInvites, canManage, currentUserId }: {
  members: Member[]
  pendingInvites: PendingInvite[]
  canManage: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function sendInvite() {
    if (!email.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmail('')
      setInviteUrl(data.invite_url)
      showToast(`Invite sent to ${data.invite_url.split('/join/')[0] ? email : email}`)
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to send invite', false)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this team member? They will lose access immediately.')) return
    setRemoving(userId)
    try {
      const res = await fetch(`/api/team/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Team member removed')
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', false)
    } finally {
      setRemoving(null)
    }
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-50 text-purple-700',
    admin: 'bg-blue-50 text-blue-700',
    staff: 'bg-gray-100 text-gray-600',
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Members list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Active Members ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {(m.full_name || m.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{m.full_name || m.email}</p>
                    {m.isSelf && <span className="text-[10px] text-gray-400">(you)</span>}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${roleColors[m.role] ?? roleColors.staff}`}>
                      {m.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{m.email} · Joined {fmtDate(m.created_at)}</p>
                </div>
              </div>
              {canManage && !m.isSelf && m.role !== 'owner' && (
                <button onClick={() => removeMember(m.id)} disabled={removing === m.id}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  {removing === m.id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Pending Invites ({pendingInvites.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{inv.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{inv.role} · Expires {fmtDate(inv.expires_at)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Awaiting</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {canManage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">Invite someone</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">They'll receive an email with a link to join your team. If Resend isn't set up, copy the link below and send it manually.</p>
          <div className="flex gap-2 mb-3">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
              placeholder="colleague@company.com"
              type="email"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
            />
            <select value={role} onChange={e => setRole(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all bg-white">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={sendInvite} disabled={inviting || !email.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <UserPlus className="w-4 h-4" />
              {inviting ? 'Sending…' : 'Invite'}
            </button>
          </div>
          {inviteUrl && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
              <p className="text-[11px] font-mono text-blue-700 truncate flex-1">{inviteUrl}</p>
              <button onClick={() => { navigator.clipboard.writeText(inviteUrl); showToast('Copied!') }}
                className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
