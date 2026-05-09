'use client'

import { useState } from 'react'
import { Summary } from '@/types/database'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar, CheckCircle2, Clock, PhoneCall, ChevronDown, ChevronUp, CreditCard, Truck } from 'lucide-react'

type PastConversation = {
  id: string
  created_at: string
  turn_count: number
  status: string
  stage: string
}

type Props = {
  conversationId: string
  initialSummary: Summary | null
  pastConversations?: PastConversation[]
  customerName?: string | null
  customerPhone?: string
}

const leadTypeColors: Record<string, string> = {
  hvac: 'bg-orange-100 text-orange-700', plumbing: 'bg-blue-100 text-blue-700',
  roofing: 'bg-yellow-100 text-yellow-700', electrical: 'bg-purple-100 text-purple-700',
  cleaning: 'bg-teal-100 text-teal-700', landscaping: 'bg-green-100 text-green-700',
  auto: 'bg-gray-100 text-gray-700', medspa: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-600', other: 'bg-gray-100 text-gray-600',
}

const MOCK_PAST: Record<string, PastConversation[]> = {
  'mock-1': [
    { id: 'past-1', created_at: new Date(Date.now() - 1000*60*60*24*45).toISOString(), turn_count: 4, status: 'closed', stage: 'won' },
    { id: 'past-2', created_at: new Date(Date.now() - 1000*60*60*24*90).toISOString(), turn_count: 2, status: 'closed', stage: 'contacted' },
  ],
  'mock-2': [
    { id: 'past-3', created_at: new Date(Date.now() - 1000*60*60*24*30).toISOString(), turn_count: 5, status: 'closed', stage: 'won' },
  ],
}

function UrgencyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={cn('w-2 h-2 rounded-full',
          i <= level
            ? level >= 4 ? 'bg-red-500' : level >= 3 ? 'bg-yellow-500' : 'bg-green-500'
            : 'bg-gray-200'
        )} />
      ))}
      <span className="text-[11px] text-gray-400 ml-1">{level}/5</span>
    </div>
  )
}

export default function SummaryPanel({ conversationId, initialSummary, customerPhone }: Props) {
  const isMock = conversationId.startsWith('mock')
  const [summary, setSummary] = useState<Summary | null>(initialSummary)
  const [generating, setGenerating] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false)
  const [followUpScheduled, setFollowUpScheduled] = useState(false)
  const [markedWon, setMarkedWon] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [sendingPayment, setSendingPayment] = useState(false)
  const [paymentSent, setPaymentSent] = useState(false)
  const [showDispatch, setShowDispatch] = useState(false)
  const [techName, setTechName] = useState('')
  const [techEta, setTechEta] = useState('30')
  const [dispatching, setDispatching] = useState(false)
  const [dispatched, setDispatched] = useState(false)

  const pastConvs = MOCK_PAST[conversationId] || []
  const extracted = summary?.extracted_data as Record<string, string | boolean | null> | null

  async function regenerate() {
    setGenerating(true)
    try {
      if (isMock) { await new Promise(r => setTimeout(r, 800)); setGenerating(false); return }
      const res = await fetch(`/api/conversations/${conversationId}/summary`, { method: 'POST' })
      if (res.ok) setSummary(await res.json())
    } finally { setGenerating(false) }
  }

  async function handleBook() {
    if (!bookingDate || !bookingTime) return
    setBooking(true)
    try {
      if (!isMock) {
        const scheduled_at = new Date(`${bookingDate}T${bookingTime}`).toISOString()
        await fetch(`/api/conversations/${conversationId}/book`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_at, notes: bookingNotes }),
        })
      } else {
        await new Promise(r => setTimeout(r, 600))
      }
      setBooked(true)
      setShowBooking(false)
    } finally { setBooking(false) }
  }

  async function handleSendPayment() {
    if (!paymentAmount) return
    setSendingPayment(true)
    try {
      if (!isMock) {
        await fetch(`/api/conversations/${conversationId}/payment-link`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(paymentAmount), note: paymentNote }),
        })
      } else {
        await new Promise(r => setTimeout(r, 600))
      }
      setPaymentSent(true)
      setShowPayment(false)
    } finally { setSendingPayment(false) }
  }

  async function handleDispatch() {
    if (!techName) return
    setDispatching(true)
    try {
      if (!isMock) {
        await fetch(`/api/conversations/${conversationId}/dispatch`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tech_name: techName, eta_minutes: parseInt(techEta) }),
        })
      } else {
        await new Promise(r => setTimeout(r, 600))
      }
      setDispatched(true)
      setShowDispatch(false)
    } finally { setDispatching(false) }
  }

  async function handleFollowUp() {
    setSchedulingFollowUp(true)
    try {
      if (!isMock) {
        await fetch(`/api/conversations/${conversationId}/follow-up`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delay_hours: 24 }),
        })
      } else {
        await new Promise(r => setTimeout(r, 500))
      }
      setFollowUpScheduled(true)
    } finally { setSchedulingFollowUp(false) }
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-100 bg-[#f7f8fc] flex flex-col overflow-y-auto min-h-0 h-full">

      {/* AI Summary section */}
      <div className="m-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">AI Summary</span>
          </div>
          <button onClick={regenerate} disabled={generating}
            className="text-gray-300 hover:text-blue-500 transition-colors p-1 rounded-lg hover:bg-blue-50">
            <RefreshCw className={cn('w-3.5 h-3.5', generating && 'animate-spin')} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {!summary ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 mb-3">Generates after a few exchanges</p>
              <Button variant="outline" size="sm" onClick={regenerate} disabled={generating}
                className="text-xs h-7 border-gray-200 rounded-lg">
                {generating ? 'Generating…' : 'Generate now'}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-gray-700 leading-relaxed">{summary.summary_text}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {summary.lead_type && (
                  <Badge className={cn('text-xs capitalize rounded-full', leadTypeColors[summary.lead_type] || leadTypeColors.other)}>
                    {summary.lead_type}
                  </Badge>
                )}
                {summary.urgency != null && <UrgencyDots level={summary.urgency} />}
              </div>
              {extracted && Object.keys(extracted).length > 0 && (
                <div className="space-y-2 pt-1 border-t border-gray-50">
                  {Object.entries(extracted).map(([key, value]) => {
                    if (!value) return null
                    return (
                      <div key={key}>
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{key.replace(/_/g,' ')}</span>
                        <p className="text-xs text-gray-700 mt-0.5">{value === true ? 'Yes' : String(value)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-3 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="space-y-2">

          {/* Book appointment */}
          {booked ? (
            <div className="flex items-center gap-2 text-emerald-600 text-xs py-2 px-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Appointment booked!</span>
            </div>
          ) : (
            <>
              <button onClick={() => setShowBooking(s => !s)}
                className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all group">
                <Calendar className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                <span className="flex-1 text-left font-medium">Book Appointment</span>
                {showBooking ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
              </button>
              {showBooking && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  <input placeholder="Notes (optional)" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  <Button onClick={handleBook} disabled={!bookingDate || !bookingTime || booking}
                    className="w-full h-8 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/30 font-semibold">
                    {booking ? 'Booking…' : 'Confirm & Send SMS'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Follow-up */}
          {followUpScheduled ? (
            <div className="flex items-center gap-2 text-blue-600 text-xs py-1 px-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Follow-up scheduled · 24h</span>
            </div>
          ) : (
            <button onClick={handleFollowUp} disabled={schedulingFollowUp}
              className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all group">
              <Clock className="w-4 h-4 text-orange-400 group-hover:text-orange-500" />
              <span className="flex-1 text-left font-medium">{schedulingFollowUp ? 'Scheduling…' : 'Schedule Follow-up'}</span>
              <span className="text-[10px] font-semibold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">24h</span>
            </button>
          )}

          {/* Mark as Won / Payment Link */}
          {markedWon ? (
            paymentSent ? (
              <div className="flex items-center gap-2 text-violet-600 text-xs py-1 px-1">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Payment link sent!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-600 text-xs py-2 px-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Marked as Won</span>
                </div>
                <button onClick={() => setShowPayment(s => !s)}
                  className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all group">
                  <CreditCard className="w-4 h-4 text-violet-500 group-hover:text-violet-600" />
                  <span className="flex-1 text-left font-medium">Send Payment Link</span>
                  {showPayment ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
                </button>
                {showPayment && (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">$</span>
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="Amount" min="1"
                        className="w-full text-xs border border-gray-200 rounded-lg pl-6 pr-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                    </div>
                    <input placeholder="Invoice note (optional)" value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                    <Button onClick={handleSendPayment} disabled={!paymentAmount || sendingPayment}
                      className="w-full h-8 text-xs bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-lg shadow-sm shadow-violet-500/30 font-semibold">
                      {sendingPayment ? 'Sending…' : 'Send via SMS'}
                    </Button>
                  </div>
                )}
              </>
            )
          ) : (
            <button onClick={async () => {
              if (!isMock) {
                await fetch(`/api/conversations/${conversationId}/stage`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stage: 'won' }),
                })
              }
              setMarkedWon(true)
            }}
              className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all group">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="flex-1 text-left font-medium">Mark as Won</span>
            </button>
          )}

          {/* Tech Dispatch */}
          {dispatched ? (
            <div className="flex items-center gap-2 text-orange-600 text-xs py-1 px-1">
              <Truck className="w-4 h-4" />
              <span className="font-medium">Tech dispatched. On-the-way SMS sent!</span>
            </div>
          ) : (
            <>
              <button onClick={() => setShowDispatch(s => !s)}
                className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all group">
                <Truck className="w-4 h-4 text-orange-400 group-hover:text-orange-500" />
                <span className="flex-1 text-left font-medium">Dispatch Tech</span>
                {showDispatch ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
              </button>
              {showDispatch && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                  <input placeholder="Tech name (e.g. Mike)" value={techName} onChange={e => setTechName(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">ETA (min)</label>
                    <input type="number" value={techEta} onChange={e => setTechEta(e.target.value)} min="5" max="240"
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                  </div>
                  <Button onClick={handleDispatch} disabled={!techName || dispatching}
                    className="w-full h-8 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm shadow-orange-500/30 font-semibold">
                    {dispatching ? 'Dispatching…' : 'Dispatch & Send SMS'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Call customer */}
          {customerPhone && (
            <a href={`tel:${customerPhone}`}
              className="w-full flex items-center gap-2 text-[13px] text-gray-700 border border-gray-150 rounded-xl px-3 py-2.5 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all group">
              <PhoneCall className="w-4 h-4 text-green-500" />
              <span className="flex-1 text-left font-medium">Call Customer</span>
            </a>
          )}
        </div>
      </div>

      {/* Customer history */}
      {pastConvs.length > 0 && (
        <div className="mx-3 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <button onClick={() => setShowHistory(s => !s)}
            className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Customer History</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{pastConvs.length}</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
            </div>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-400 mb-2">Returning customer · {pastConvs.length} prior {pastConvs.length === 1 ? 'conversation' : 'conversations'}</p>
              {pastConvs.map(pc => (
                <div key={pc.id} className="flex items-center justify-between py-2 border-t border-gray-50">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{new Date(pc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{pc.turn_count} messages · {pc.stage}</p>
                  </div>
                  <Badge className={cn('text-[10px] rounded-full', pc.stage === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                    {pc.stage}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No history state */}
      {pastConvs.length === 0 && (
        <div className="mx-3 mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Customer History</p>
          <p className="text-xs text-gray-400">First time contacting</p>
        </div>
      )}
    </div>
  )
}
