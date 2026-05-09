'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, PhoneCall, Zap, Trophy, DollarSign, Clock, MapPin } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ServiceAreaMap = dynamic(() => import('@/components/ServiceAreaMap'), { ssr: false, loading: () => <div className="w-full h-full rounded-xl bg-gray-100 animate-pulse" /> })
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

const DATA = {
  '7d': {
    summary: { total: 14, responded: 12, qualified: 6, won: 4, responseRate: 86, qualifiedRate: 43, revenue: 2200, avgResponseSec: 7 },
    volumeByDay: [
      { date: 'Mon', calls: 2, qualified: 1 }, { date: 'Tue', calls: 3, qualified: 2 },
      { date: 'Wed', calls: 1, qualified: 0 }, { date: 'Thu', calls: 4, qualified: 2 },
      { date: 'Fri', calls: 2, qualified: 1 }, { date: 'Sat', calls: 1, qualified: 0 },
      { date: 'Sun', calls: 1, qualified: 0 },
    ],
    busiestHours: [
      { hour: '7a', calls: 1 }, { hour: '8a', calls: 3 }, { hour: '9a', calls: 5 },
      { hour: '10a', calls: 4 }, { hour: '11a', calls: 3 }, { hour: '12p', calls: 2 },
      { hour: '1p', calls: 1 }, { hour: '2p', calls: 2 }, { hour: '3p', calls: 3 },
      { hour: '4p', calls: 4 }, { hour: '5p', calls: 5 }, { hour: '6p', calls: 3 },
      { hour: '7p', calls: 2 }, { hour: '8p', calls: 1 },
    ],
    stageBreakdown: [
      { stage: 'New', count: 2, color: '#94a3b8' }, { stage: 'Contacted', count: 3, color: '#3b82f6' },
      { stage: 'Quoted', count: 2, color: '#f59e0b' }, { stage: 'Booked', count: 3, color: '#8b5cf6' },
      { stage: 'Won', count: 4, color: '#10b981' }, { stage: 'Lost', count: 0, color: '#f43f5e' },
    ],
    afterHoursPct: 38,
  },
  '30d': {
    summary: { total: 47, responded: 38, qualified: 19, won: 11, responseRate: 81, qualifiedRate: 40, revenue: 6050, avgResponseSec: 8 },
    volumeByDay: [
      { date: '25', calls: 2, qualified: 1 }, { date: '26', calls: 4, qualified: 2 },
      { date: '27', calls: 1, qualified: 0 }, { date: '28', calls: 3, qualified: 1 },
      { date: '29', calls: 5, qualified: 3 }, { date: '30', calls: 6, qualified: 2 },
      { date: '1',  calls: 2, qualified: 1 }, { date: '2',  calls: 4, qualified: 2 },
      { date: '3',  calls: 3, qualified: 1 }, { date: '4',  calls: 1, qualified: 0 },
      { date: '5',  calls: 5, qualified: 2 }, { date: '6',  calls: 4, qualified: 2 },
      { date: '7',  calls: 3, qualified: 1 }, { date: '8',  calls: 4, qualified: 1 },
    ],
    busiestHours: [
      { hour: '6a', calls: 1 }, { hour: '7a', calls: 3 }, { hour: '8a', calls: 6 },
      { hour: '9a', calls: 8 }, { hour: '10a', calls: 7 }, { hour: '11a', calls: 5 },
      { hour: '12p', calls: 4 }, { hour: '1p', calls: 3 }, { hour: '2p', calls: 5 },
      { hour: '3p', calls: 6 }, { hour: '4p', calls: 7 }, { hour: '5p', calls: 8 },
      { hour: '6p', calls: 5 }, { hour: '7p', calls: 3 }, { hour: '8p', calls: 2 },
    ],
    stageBreakdown: [
      { stage: 'New', count: 9, color: '#94a3b8' }, { stage: 'Contacted', count: 8, color: '#3b82f6' },
      { stage: 'Quoted', count: 7, color: '#f59e0b' }, { stage: 'Booked', count: 6, color: '#8b5cf6' },
      { stage: 'Won', count: 11, color: '#10b981' }, { stage: 'Lost', count: 6, color: '#f43f5e' },
    ],
    afterHoursPct: 41,
  },
  '90d': {
    summary: { total: 134, responded: 112, qualified: 58, won: 34, responseRate: 84, qualifiedRate: 43, revenue: 18700, avgResponseSec: 9 },
    volumeByDay: [
      { date: 'W1', calls: 9, qualified: 4 }, { date: 'W2', calls: 12, qualified: 5 },
      { date: 'W3', calls: 8, qualified: 3 }, { date: 'W4', calls: 14, qualified: 6 },
      { date: 'W5', calls: 11, qualified: 5 }, { date: 'W6', calls: 16, qualified: 7 },
      { date: 'W7', calls: 13, qualified: 6 }, { date: 'W8', calls: 18, qualified: 8 },
      { date: 'W9', calls: 15, qualified: 7 }, { date: 'W10', calls: 18, qualified: 7 },
    ],
    busiestHours: [
      { hour: '6a', calls: 3 }, { hour: '7a', calls: 9 }, { hour: '8a', calls: 18 },
      { hour: '9a', calls: 22 }, { hour: '10a', calls: 20 }, { hour: '11a', calls: 15 },
      { hour: '12p', calls: 11 }, { hour: '1p', calls: 9 }, { hour: '2p', calls: 14 },
      { hour: '3p', calls: 17 }, { hour: '4p', calls: 20 }, { hour: '5p', calls: 23 },
      { hour: '6p', calls: 14 }, { hour: '7p', calls: 8 }, { hour: '8p', calls: 5 },
    ],
    stageBreakdown: [
      { stage: 'New', count: 22, color: '#94a3b8' }, { stage: 'Contacted', count: 24, color: '#3b82f6' },
      { stage: 'Quoted', count: 21, color: '#f59e0b' }, { stage: 'Booked', count: 19, color: '#8b5cf6' },
      { stage: 'Won', count: 34, color: '#10b981' }, { stage: 'Lost', count: 14, color: '#f43f5e' },
    ],
    afterHoursPct: 44,
  },
}

const MOCK_30 = DATA['30d']

function Trend({ up, value }: { up: boolean; value: number }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold', up ? 'text-emerald-600' : 'text-red-500')}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {value}% vs prior
    </span>
  )
}

function StatCard({ label, value, sub, icon, iconBg, trend }: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; iconBg: string
  trend?: { up: boolean; value: number }
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>{icon}</div>
        {trend && <Trend up={trend.up} value={trend.value} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3 tracking-tight tabular-nums">{value}</p>
      <p className="text-[13px] font-medium text-gray-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

const CallsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2.5 rounded-xl shadow-xl space-y-1">
      <p className="font-semibold text-gray-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.value} {p.dataKey}</p>
      ))}
    </div>
  )
}

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="text-indigo-300">{payload[0].value} calls</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const { summary, volumeByDay, busiestHours, stageBreakdown, afterHoursPct } = DATA[period]

  const stageTotal = stageBreakdown.reduce((s, d) => s + d.count, 0)
  const winRate = summary.total > 0 ? Math.round((summary.won / summary.total) * 100) : 0
  const maxHour = Math.max(...busiestHours.map(h => h.calls))
  const peakHour = busiestHours.find(h => h.calls === maxHour)?.hour ?? '5p'

  const funnel = [
    { label: 'Missed',    n: summary.total,     color: '#64748b' },
    { label: 'Responded', n: summary.responded,  color: '#3b82f6' },
    { label: 'Qualified', n: summary.qualified,  color: '#f59e0b' },
    { label: 'Won',       n: summary.won,        color: '#10b981' },
  ]

  const fmtRevenue = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString()}`

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#f7f8fc]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">RecMail AI performance · demo data</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
              period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>{p}</button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Insight banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm shadow-blue-200">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[13px]">
              Your AI replied to {summary.responded} missed calls in under {summary.avgResponseSec} seconds —
              recovering an estimated <span className="font-bold">{fmtRevenue(summary.revenue)}</span> this period.
            </p>
            <p className="text-blue-200 text-[11px] mt-0.5">
              {afterHoursPct}% of those calls came in after business hours when your team was unavailable.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-xl tabular-nums">{summary.responseRate}%</p>
            <p className="text-blue-200 text-[10px]">response rate</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Calls Captured" value={summary.total} sub="missed calls engaged by AI"
            icon={<PhoneCall className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50"
            trend={{ up: true, value: 12 }} />
          <StatCard label="Avg Response Time" value={`${summary.avgResponseSec}s`} sub="from missed call to first text"
            icon={<Clock className="w-4 h-4 text-blue-600" />} iconBg="bg-blue-50"
            trend={{ up: true, value: 4 }} />
          <StatCard label="Qualified Rate" value={`${summary.qualifiedRate}%`} sub={`${summary.qualified} leads qualified`}
            icon={<Trophy className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50"
            trend={{ up: true, value: 7 }} />
          <StatCard label="Revenue Recovered" value={fmtRevenue(summary.revenue)} sub={`${summary.won} jobs closed won`}
            icon={<DollarSign className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50"
            trend={{ up: true, value: 21 }} />
        </div>

        {/* Dual area chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <div>
              <h2 className="text-[13px] font-bold text-gray-800">Calls vs Qualified</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily volume this period</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> +14% vs prior period
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={volumeByDay} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CallsTooltip />} />
              <Legend
                iconType="circle" iconSize={7}
                formatter={(v) => <span className="text-[11px] text-gray-500 capitalize">{v}</span>}
                wrapperStyle={{ paddingBottom: 8 }}
              />
              <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#callGrad)"
                dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="qualified" stroke="#f59e0b" strokeWidth={2}
                fill="url(#qualGrad)"
                dot={false} activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hours + Pipeline */}
        <div className="grid grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 pt-5 pb-4">
              <h2 className="text-[13px] font-bold text-gray-800">Peak Call Hours</h2>
              <p className="text-xs text-gray-400 mt-0.5">When leads are most active</p>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={busiestHours} margin={{ top: 4, right: 16, bottom: 8, left: 0 }} barCategoryGap="20%">
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
                  {busiestHours.map((d, i) => (
                    <Cell key={i} fill={d.calls >= maxHour * 0.75 ? '#6366f1' : '#e0e7ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 px-6 pb-4 pt-2 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-[10px] text-gray-400">Peak hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-200" />
                <span className="text-[10px] text-gray-400">Normal</span>
              </div>
              <span className="ml-auto text-[11px] font-semibold text-indigo-600">
                {peakHour} busiest · {afterHoursPct}% after-hours
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[13px] font-bold text-gray-800">Pipeline Stages</h2>
                <p className="text-xs text-gray-400 mt-0.5">{stageTotal} leads total</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">{winRate}%</p>
                <p className="text-[10px] text-gray-400">win rate</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {stageBreakdown.map(({ stage, count, color }) => {
                const pct = Math.round((count / stageTotal) * 100)
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{stage}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[13px] font-bold text-gray-800">Conversion Funnel</h2>
              <p className="text-xs text-gray-400 mt-0.5">Lead drop-off at each stage</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5" />
              {winRate}% end-to-end close rate
            </div>
          </div>
          <div className="space-y-2.5">
            {funnel.map((step, i) => {
              const widthPct = Math.round((step.n / funnel[0].n) * 100)
              const drop = i > 0 ? 100 - Math.round((step.n / funnel[i - 1].n) * 100) : null
              return (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-xs font-semibold text-gray-500">{step.label}</span>
                  </div>
                  <div className="flex-1 h-9 bg-gray-50 rounded-xl overflow-hidden">
                    <div
                      className="h-full rounded-xl flex items-center px-3 transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 8)}%`, backgroundColor: step.color }}
                    >
                      <span className="text-xs font-bold text-white">{step.n}</span>
                    </div>
                  </div>
                  <div className="w-28 flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-10 text-right">{widthPct}%</span>
                    {drop !== null && drop > 0 && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">−{drop}%</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service Area Map */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-[13px] font-bold text-gray-800">Service Area Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">Where your calls are coming from</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-700" />
                <span className="text-gray-500">Recent (last 7d)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-gray-600" />
                <span className="text-gray-500">Past</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-500">13 locations · Fort Worth metro</span>
              </div>
            </div>
          </div>
          <div className="h-[380px] p-4">
            <ServiceAreaMap />
          </div>
        </div>

      </div>
    </div>
  )
}
