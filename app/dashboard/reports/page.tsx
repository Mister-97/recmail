import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Download, TrendingUp, Users, CheckCircle2, MessageSquare } from 'lucide-react'
import ExportButton from './ExportButton'

export default async function ReportsPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) redirect('/dashboard')

  const clientId = userRow.client_id

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { data: allConvs },
    { count: total30 },
    { count: qualified30 },
    { count: total7 },
    { count: qualified7 },
    { data: recentConvs },
  ] = await Promise.all([
    supabase.from('conversations').select('id, status, turn_count, created_at, updated_at, customer_name, customer_phone').eq('client_id', clientId),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', since30),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'qualified').gte('created_at', since30),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', clientId).gte('created_at', since7),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'qualified').gte('created_at', since7),
    supabase.from('conversations').select('id, customer_name, customer_phone, status, turn_count, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(20),
  ])

  const all = allConvs ?? []
  const totalAll = all.length
  const qualifiedAll = all.filter(c => c.status === 'qualified').length
  const qualifiedRate30 = (total30 ?? 0) > 0 ? Math.round(((qualified30 ?? 0) / (total30 ?? 1)) * 100) : 0
  const qualifiedRate7 = (total7 ?? 0) > 0 ? Math.round(((qualified7 ?? 0) / (total7 ?? 1)) * 100) : 0
  const avgTurns = totalAll > 0 ? (all.reduce((s, c) => s + (c.turn_count ?? 0), 0) / totalAll).toFixed(1) : '0'

  // Daily breakdown for last 30 days
  const dailyMap: Record<string, { total: number; qualified: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    dailyMap[d] = { total: 0, qualified: 0 }
  }
  for (const c of all) {
    const day = c.created_at.slice(0, 10)
    if (dailyMap[day]) {
      dailyMap[day].total++
      if (c.status === 'qualified') dailyMap[day].qualified++
    }
  }
  const dailyData = Object.entries(dailyMap)
  const maxTotal = Math.max(...dailyData.map(([, v]) => v.total), 1)

  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8 max-w-4xl overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Lead performance and activity summary</p>
        </div>
        <ExportButton clientId={clientId} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 30 days</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: 'Leads', value: total30 ?? 0 },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'Qualified', value: qualified30 ?? 0 },
              { icon: <TrendingUp className="w-4 h-4 text-blue-500" />, label: 'Conv. rate', value: `${qualifiedRate30}%` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Last 7 days</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <MessageSquare className="w-4 h-4 text-indigo-500" />, label: 'Leads', value: total7 ?? 0 },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'Qualified', value: qualified7 ?? 0 },
              { icon: <TrendingUp className="w-4 h-4 text-blue-500" />, label: 'Conv. rate', value: `${qualifiedRate7}%` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All time */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'All-time leads', value: totalAll, color: 'text-gray-900' },
          { label: 'All-time qualified', value: qualifiedAll, color: 'text-emerald-600' },
          { label: 'Avg turns to qualify', value: avgTurns, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 30-day chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-sm font-bold text-gray-900 mb-4">Daily leads — last 30 days</p>
        <div className="flex items-end gap-1 h-24">
          {dailyData.map(([day, v]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-0.5" title={`${day}: ${v.total} leads, ${v.qualified} qualified`}>
              <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                <div className="w-full bg-indigo-100 rounded-sm relative overflow-hidden"
                  style={{ height: `${Math.max(2, (v.total / maxTotal) * 88)}px` }}>
                  {v.qualified > 0 && (
                    <div className="absolute bottom-0 w-full bg-emerald-400 rounded-sm"
                      style={{ height: `${(v.qualified / v.total) * 100}%` }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-100" /><span className="text-[10px] text-gray-400">Total leads</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-[10px] text-gray-400">Qualified</span></div>
        </div>
      </div>

      {/* Recent leads table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Recent Leads</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Turns</th>
              <th className="text-left px-5 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(recentConvs ?? []).map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-800">{c.customer_name || c.customer_phone}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{c.turn_count}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
