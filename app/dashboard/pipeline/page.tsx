'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Flame, Droplets, Wind, Wrench, Zap, Home } from 'lucide-react'

type Stage = 'new' | 'contacted' | 'quoted' | 'booked' | 'won' | 'lost'
type ServiceType = 'hvac' | 'plumbing' | 'roofing' | 'electrical' | 'general'

type MockConv = {
  id: string
  customer_name: string | null
  customer_phone: string
  stage: Stage
  service: ServiceType
  value: number
  urgency: number
  updated_at: string
  preview: string
}

const STAGE_CONFIG: Record<Stage, { label: string; bg: string; headerColor: string; accent: string }> = {
  new:       { label: 'New',       bg: 'bg-[#f1f3f4]',  headerColor: 'bg-gray-200 text-gray-600',    accent: 'bg-gray-400' },
  contacted: { label: 'Contacted', bg: 'bg-blue-50/60',  headerColor: 'bg-blue-100 text-blue-700',   accent: 'bg-blue-400' },
  quoted:    { label: 'Quoted',    bg: 'bg-amber-50/60', headerColor: 'bg-amber-100 text-amber-700', accent: 'bg-amber-400' },
  booked:    { label: 'Booked',    bg: 'bg-purple-50/60',headerColor: 'bg-purple-100 text-purple-700',accent: 'bg-purple-500' },
  won:       { label: 'Won',       bg: 'bg-emerald-50/60',headerColor: 'bg-emerald-100 text-emerald-700',accent: 'bg-emerald-500' },
  lost:      { label: 'Lost',      bg: 'bg-red-50/40',   headerColor: 'bg-red-100 text-red-500',     accent: 'bg-red-400' },
}

const SERVICE_CONFIG: Record<ServiceType, { label: string; icon: React.ReactNode; color: string }> = {
  hvac:       { label: 'HVAC',       icon: <Wind className="w-3 h-3" />,     color: 'bg-blue-100 text-blue-600' },
  plumbing:   { label: 'Plumbing',   icon: <Droplets className="w-3 h-3" />, color: 'bg-cyan-100 text-cyan-600' },
  roofing:    { label: 'Roofing',    icon: <Home className="w-3 h-3" />,     color: 'bg-orange-100 text-orange-600' },
  electrical: { label: 'Electrical', icon: <Zap className="w-3 h-3" />,      color: 'bg-yellow-100 text-yellow-600' },
  general:    { label: 'General',    icon: <Wrench className="w-3 h-3" />,   color: 'bg-gray-100 text-gray-600' },
}

const STAGES: Stage[] = ['new', 'contacted', 'quoted', 'booked', 'won', 'lost']

const MOCK: MockConv[] = [
  { id: 'mock-5', customer_name: 'Maria Rodriguez', customer_phone: '+18175550488', stage: 'new',       service: 'plumbing',   value: 420,  urgency: 5, updated_at: new Date(Date.now() - 1000*60*60*5).toISOString(),  preview: 'Emergency leak — water through ceiling' },
  { id: 'mock-1', customer_name: 'James Martinez',  customer_phone: '+18175550101', stage: 'contacted', service: 'hvac',       value: 350,  urgency: 4, updated_at: new Date(Date.now() - 1000*60*5).toISOString(),    preview: 'AC stopped working, kids at home' },
  { id: 'mock-3', customer_name: null,               customer_phone: '+18175550247', stage: 'contacted', service: 'roofing',    value: 800,  urgency: 2, updated_at: new Date(Date.now() - 1000*60*60).toISOString(),   preview: 'Storm damage — missing shingles' },
  { id: 'mock-8', customer_name: 'Tony Reyes',       customer_phone: '+18175550532', stage: 'quoted',    service: 'hvac',       value: 3200, urgency: 2, updated_at: new Date(Date.now() - 1000*60*60*2).toISOString(), preview: 'Full HVAC system replacement' },
  { id: 'mock-9', customer_name: 'Priya Sharma',     customer_phone: '+18175550709', stage: 'quoted',    service: 'electrical', value: 650,  urgency: 3, updated_at: new Date(Date.now() - 1000*60*60*6).toISOString(), preview: 'Panel upgrade — 200 amp service' },
  { id: 'mock-2', customer_name: 'Sarah Collins',    customer_phone: '+18175550182', stage: 'booked',    service: 'hvac',       value: 180,  urgency: 1, updated_at: new Date(Date.now() - 1000*60*32).toISOString(),   preview: 'Heating tune-up — Thu 8–10am' },
  { id: 'mock-6', customer_name: 'Carlos Rivera',    customer_phone: '+18175550561', stage: 'booked',    service: 'hvac',       value: 220,  urgency: 2, updated_at: new Date(Date.now() - 1000*60*60*8).toISOString(),  preview: 'AC tune-up — Wed 2pm' },
  { id: 'mock-7', customer_name: 'Linda Chen',       customer_phone: '+18175550634', stage: 'won',       service: 'plumbing',   value: 950,  urgency: 1, updated_at: new Date(Date.now() - 1000*60*60*24).toISOString(), preview: 'Water heater replacement' },
  { id: 'mock-4', customer_name: 'David Kim',        customer_phone: '+18175550319', stage: 'won',       service: 'plumbing',   value: 310,  urgency: 1, updated_at: new Date(Date.now() - 1000*60*60*3).toISOString(), preview: 'Plumbing repair complete' },
]

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  return phone
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtVal(n: number) {
  return n >= 1000 ? `$${(n/1000).toFixed(1).replace(/\.0$/,'')}k` : `$${n}`
}

export default function PipelinePage() {
  const [convs, setConvs] = useState(MOCK)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Stage | null>(null)
  const router = useRouter()

  const byStage = (stage: Stage) => convs.filter(c => c.stage === stage)

  const openValue = convs
    .filter(c => c.stage !== 'lost' && c.stage !== 'won')
    .reduce((s, c) => s + c.value, 0)
  const wonValue = convs
    .filter(c => c.stage === 'won')
    .reduce((s, c) => s + c.value, 0)

  function handleDrop(stage: Stage) {
    if (!dragging) return
    setConvs(prev => prev.map(c => c.id === dragging ? { ...c, stage } : c))
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-6 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900">Pipeline</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">{convs.length} leads</span>
          <span className="text-gray-200">|</span>
          <span className="text-gray-500">Open: <span className="font-semibold text-gray-800">{fmtVal(openValue)}</span></span>
          <span className="text-gray-200">|</span>
          <span className="text-gray-500">Won: <span className="font-semibold text-emerald-600">{fmtVal(wonValue)}</span></span>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 h-full min-w-max">
          {STAGES.map(stage => {
            const cards = byStage(stage)
            const cfg = STAGE_CONFIG[stage]
            const isDragTarget = dragOver === stage
            const colValue = cards.reduce((s, c) => s + c.value, 0)

            return (
              <div
                key={stage}
                className={cn(
                  'flex flex-col w-60 rounded-xl border-2 transition-all duration-150',
                  isDragTarget ? 'border-blue-400 bg-blue-50 scale-[1.01]' : `border-transparent ${cfg.bg}`
                )}
                onDragOver={e => { e.preventDefault(); setDragOver(stage) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column header */}
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase', cfg.headerColor)}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                  </div>
                  {colValue > 0 && (
                    <p className="text-[11px] font-semibold text-gray-500 pl-0.5">{fmtVal(colValue)}</p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mx-3 mb-2 h-0.5 rounded-full bg-gray-200/80">
                  <div className={cn('h-full rounded-full transition-all', cfg.accent)}
                    style={{ width: cards.length ? '100%' : '0%' }} />
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  {cards.map(conv => {
                    const svc = SERVICE_CONFIG[conv.service]
                    return (
                      <div
                        key={conv.id}
                        draggable
                        onDragStart={() => setDragging(conv.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null) }}
                        onClick={() => router.push(`/dashboard/${conv.id}`)}
                        className={cn(
                          'bg-white rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all',
                          dragging === conv.id && 'opacity-40 scale-95'
                        )}
                      >
                        {/* Name + time */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[13px] font-semibold text-gray-900 leading-tight">
                            {conv.customer_name || formatPhone(conv.customer_phone)}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(conv.updated_at)}</span>
                        </div>

                        {/* Preview */}
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-2.5">{conv.preview}</p>

                        {/* Footer row */}
                        <div className="flex items-center justify-between">
                          <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', svc.color)}>
                            {svc.icon}{svc.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {conv.urgency >= 4 && (
                              <span title="Urgent"><Flame className="w-3 h-3 text-orange-400" /></span>
                            )}
                            <span className="text-[12px] font-bold text-gray-700">{fmtVal(conv.value)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {cards.length === 0 && (
                    <div className={cn(
                      'border-2 border-dashed rounded-xl h-16 flex items-center justify-center transition-colors',
                      isDragTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    )}>
                      <span className="text-[11px] text-gray-300">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
