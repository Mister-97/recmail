import { serviceSupabase } from '@/lib/supabase/service'
import Link from 'next/link'
import { Users, MessageSquare, CheckCircle2, Phone, TrendingUp, AlertCircle, ExternalLink, Clock } from 'lucide-react'

export default async function AdminPage() {
  const [
    { data: clients, count: clientCount },
    { count: convCount },
    { count: msgCount },
    { count: qualifiedCount },
    { count: openCount },
  ] = await Promise.all([
    serviceSupabase.from('clients').select('id, business_name, twilio_number, plan, industry, created_at, stripe_account_id, slack_webhook_url', { count: 'exact' }).order('created_at', { ascending: false }),
    serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('messages').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'qualified'),
    serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  // Per-client conversation counts
  const clientIds = (clients ?? []).map(c => c.id)
  const perClientStats: Record<string, { total: number; qualified: number; open: number }> = {}
  if (clientIds.length > 0) {
    const { data: convStats } = await serviceSupabase
      .from('conversations')
      .select('client_id, status')
      .in('client_id', clientIds)
    for (const row of convStats ?? []) {
      if (!perClientStats[row.client_id]) perClientStats[row.client_id] = { total: 0, qualified: 0, open: 0 }
      perClientStats[row.client_id].total++
      if (row.status === 'qualified') perClientStats[row.client_id].qualified++
      if (row.status === 'open') perClientStats[row.client_id].open++
    }
  }

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }

  const today = new Date()
  const fmtDate = (d: string) => {
    const diff = Math.floor((today.getTime() - new Date(d).getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 30) return `${diff}d ago`
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations</h1>
          <p className="text-sm text-gray-400 mt-0.5">RecMail internal team dashboard</p>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { icon: <Users className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50', label: 'Active Clients', value: clientCount ?? 0 },
          { icon: <MessageSquare className="w-4 h-4 text-indigo-600" />, bg: 'bg-indigo-50', label: 'Total Conversations', value: convCount ?? 0 },
          { icon: <Phone className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50', label: 'Messages Sent', value: msgCount ?? 0 },
          { icon: <AlertCircle className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50', label: 'Open Leads', value: openCount ?? 0 },
          { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Qualified Leads', value: qualifiedCount ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>{stat.icon}</div>
            <p className="text-2xl font-black text-gray-900">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Client table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">All Clients</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click a client to view their account details and conversations</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Business</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Industry</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">RecMail #</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Integrations</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Conversations</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Qualified</th>
              <th className="text-left px-6 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(clients ?? []).map((client) => {
              const stats = perClientStats[client.id] ?? { total: 0, qualified: 0, open: 0 }
              const isSetup = !!client.twilio_number
              return (
                <tr key={client.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                        {client.business_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{client.business_name}</p>
                        {!isSetup && <p className="text-[10px] text-amber-600 font-medium">Setup incomplete</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 capitalize">{client.industry ?? 'other'}</td>
                  <td className="px-6 py-4">
                    {client.twilio_number
                      ? <span className="font-mono text-xs text-gray-700">{client.twilio_number}</span>
                      : <span className="text-xs text-gray-300">Not provisioned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${planColors[client.plan] ?? planColors.starter}`}>
                      {client.plan ?? 'starter'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span title="Stripe" className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${client.stripe_account_id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>S</span>
                      <span title="Slack" className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${client.slack_webhook_url ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>S</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{stats.total}</span>
                      {stats.open > 0 && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">{stats.open} open</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {stats.qualified > 0
                      ? <span className="text-sm font-semibold text-emerald-600">{stats.qualified}</span>
                      : <span className="text-sm text-gray-300">0</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">{fmtDate(client.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(clients ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
