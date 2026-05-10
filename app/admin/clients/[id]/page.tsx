import { serviceSupabase } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, ExternalLink, Clock, DollarSign, Activity,
  Zap, User, Hash
} from 'lucide-react'
import AdminClientActions from './AdminClientActions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params

  const [
    { data: client },
    { data: conversations, count: convCount },
    { data: users },
    { data: auditLog },
  ] = await Promise.all([
    serviceSupabase.from('clients').select('*').eq('id', id).single(),
    serviceSupabase
      .from('conversations')
      .select('id, customer_phone, customer_name, status, turn_count, created_at, updated_at')
      .eq('client_id', id)
      .order('updated_at', { ascending: false })
      .limit(50),
    serviceSupabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .eq('client_id', id),
    serviceSupabase
      .from('admin_audit_log')
      .select('id, action, details, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!client) notFound()

  // Fetch summaries properly after we have conversation IDs
  const convIds = (conversations ?? []).map(c => c.id)
  const { data: summaryData } = convIds.length > 0
    ? await serviceSupabase.from('summaries').select('conversation_id, lead_type, urgency').in('conversation_id', convIds)
    : { data: [] }

  const summaryMap: Record<string, { lead_type: string; urgency: number }> = {}
  for (const s of summaryData ?? []) {
    summaryMap[s.conversation_id] = s
  }

  const convList = conversations ?? []
  const qualified = convList.filter(c => c.status === 'qualified').length
  const open = convList.filter(c => c.status === 'open').length
  const closed = convList.filter(c => c.status === 'closed').length

  // Health checklist
  const checks = [
    { label: 'Twilio number provisioned', ok: !!client.twilio_number },
    { label: 'Stripe Connect linked', ok: !!client.stripe_account_id },
    { label: 'Slack webhook configured', ok: !!client.slack_webhook_url },
    { label: 'AI prompt customized', ok: !!client.gemini_prompt_override },
    { label: 'Has received conversations', ok: convList.length > 0 },
    { label: 'Has qualified leads', ok: qualified > 0 },
  ]
  const healthScore = checks.filter(c => c.ok).length

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    churned: 'bg-gray-100 text-gray-500',
  }
  const convStatusColors: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const fmtTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-lg font-black text-gray-600">
              {client.business_name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.business_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {client.twilio_number && (
                  <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {client.twilio_number}
                  </span>
                )}
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[client.plan_status ?? 'trial']}`}>
                  {client.plan_status ?? 'trial'}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${planColors[client.plan ?? 'starter']}`}>
                  {client.plan ?? 'starter'}
                </span>
                {client.industry && (
                  <span className="text-[11px] text-gray-400 capitalize">{client.industry}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Client since</p>
            <p className="text-sm font-semibold text-gray-700">{fmtDate(client.created_at)}</p>
            <Link
              href={`/dashboard`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 mt-2"
            >
              <ExternalLink className="w-3 h-3" /> View as client
            </Link>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />, bg: 'bg-emerald-50', label: 'MRR', value: `$${(client.mrr ?? 0).toLocaleString()}` },
          { icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />, bg: 'bg-indigo-50', label: 'Conversations', value: convCount ?? 0 },
          { icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />, bg: 'bg-amber-50', label: 'Open', value: open },
          { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Qualified', value: qualified },
          { icon: <Activity className="w-3.5 h-3.5 text-gray-500" />, bg: 'bg-gray-50', label: 'Closed', value: closed },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>{s.icon}</div>
            <p className="text-xl font-black text-gray-900">{typeof s.value === 'number' ? s.value : s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: health + account actions */}
        <div className="col-span-1 space-y-4">
          {/* Health checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Account Health</h2>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(healthScore / checks.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500">{healthScore}/{checks.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {checks.map(check => (
                <div key={check.label} className="flex items-center gap-2.5">
                  {check.ok
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={`text-xs ${check.ok ? 'text-gray-700' : 'text-gray-400'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Integrations</h2>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-violet-100 text-violet-700 text-[9px] font-bold flex items-center justify-center">S</span>
                  Stripe Connect
                </span>
                {client.stripe_account_id
                  ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
                  : <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Not linked</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center">S</span>
                  Slack Webhook
                </span>
                {client.slack_webhook_url
                  ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
                  : <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Not linked</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Twilio Number
                </span>
                {client.twilio_number
                  ? <span className="text-[10px] font-mono text-gray-600">{client.twilio_number}</span>
                  : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Not provisioned</span>}
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Team Members</h2>
            {(users ?? []).length === 0 ? (
              <p className="text-xs text-gray-400">No users linked.</p>
            ) : (
              <div className="space-y-2">
                {(users ?? []).map(u => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700">
                      {(u.full_name || u.email)?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{u.full_name || u.email}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">System Info</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-[10px] text-gray-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Client ID</dt>
                <dd className="text-[10px] font-mono text-gray-500 break-all mt-0.5">{client.id}</dd>
              </div>
              {client.owner_id && (
                <div>
                  <dt className="text-[10px] text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Owner UID</dt>
                  <dd className="text-[10px] font-mono text-gray-500 break-all mt-0.5">{client.owner_id}</dd>
                </div>
              )}
              {client.gemini_prompt_override && (
                <div>
                  <dt className="text-[10px] text-gray-400 flex items-center gap-1"><Zap className="w-3 h-3" /> AI Prompt</dt>
                  <dd className="text-[10px] text-gray-500 mt-0.5 line-clamp-3">{client.gemini_prompt_override}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right column: edit actions + conversations */}
        <div className="col-span-2 space-y-4">
          {/* Account settings (client component) */}
          <AdminClientActions
            clientId={client.id}
            initialPlan={client.plan ?? 'starter'}
            initialStatus={client.plan_status ?? 'trial'}
            initialNotes={client.admin_notes ?? ''}
            initialMrr={client.mrr ?? 0}
            initialBusinessName={client.business_name ?? ''}
            initialPrompt={client.gemini_prompt_override ?? ''}
            initialTwilioNumber={client.twilio_number ?? ''}
          />

          {/* Conversations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Conversations</h2>
                <p className="text-xs text-gray-400 mt-0.5">{convCount ?? 0} total — most recent first</p>
              </div>
            </div>
            {convList.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                No conversations yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {convList.map(conv => {
                  const summary = summaryMap[conv.id]
                  return (
                    <div key={conv.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                            {(conv.customer_name || conv.customer_phone)?.slice(-2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {conv.customer_name || conv.customer_phone}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${convStatusColors[conv.status]}`}>
                                {conv.status}
                              </span>
                              <span className="text-[10px] text-gray-400">{conv.turn_count} turns</span>
                              {summary && (
                                <>
                                  <span className="text-[10px] text-gray-300">·</span>
                                  <span className="text-[10px] text-gray-500 capitalize">{summary.lead_type}</span>
                                  {summary.urgency >= 4 && (
                                    <span className="text-[10px] font-semibold text-red-500">urgent</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtTime(conv.updated_at)}
                          </span>
                          <Link href={`/admin/conversations/${conv.id}`}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800">
                            Open
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Analytics */}
          {convList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Analytics</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{convList.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total Convos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {convList.length > 0 ? Math.round((qualified / convList.length) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Qualified Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">
                    {convList.length > 0 ? (convList.reduce((s, c) => s + (c.turn_count ?? 0), 0) / convList.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Avg Turns</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-600">{open}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Still Open</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {[
                  { label: 'Open', count: open, color: 'bg-blue-500' },
                  { label: 'Qualified', count: qualified, color: 'bg-emerald-500' },
                  { label: 'Closed', count: closed, color: 'bg-gray-300' },
                ].map(s => (
                  <div key={s.label} className="flex-1">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-semibold text-gray-700">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${convList.length ? (s.count / convList.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {(auditLog ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Team Activity Log</h2>
                <p className="text-xs text-gray-400 mt-0.5">All admin actions on this account</p>
              </div>
              <div className="divide-y divide-gray-50">
                {(auditLog ?? []).map(log => (
                  <div key={log.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-700 capitalize">{log.action.replace(/_/g, ' ')}</span>
                      {log.details && (
                        <span className="text-xs text-gray-400 ml-2">
                          {log.action === 'provision_number' && (log.details as any).phone_number}
                          {log.action === 'password_reset' && `→ ${(log.details as any).email}`}
                          {log.action === 'manual_sms' && `to ${(log.details as any).to}`}
                          {log.action === 'update_client' && Object.keys(log.details as any).join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{fmtTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
