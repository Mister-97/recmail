'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Send, Users, MessageSquare, TrendingUp, Plus, X, Clock, CheckCircle2, Megaphone, Sparkles, Smartphone } from 'lucide-react'

type Campaign = {
  id: string
  name: string
  message: string
  audience: string
  status: 'sent' | 'scheduled' | 'draft'
  sent_at?: string
  scheduled_at?: string
  recipient_count: number
  delivered_count: number
  reply_count: number
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Summer AC Tune-Up Promo',
    message: 'Hey! Summer is here and your AC is working overtime. Book a tune-up this week and we will make sure you stay cool all season. Reply YES to schedule.',
    audience: 'past',
    status: 'sent',
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    recipient_count: 84,
    delivered_count: 81,
    reply_count: 23,
  },
  {
    id: 'c2',
    name: 'Spring Roof Inspection Offer',
    message: 'Hi there! Spring is a great time to check for any winter damage on your roof. We are offering free inspections this month. Want us to swing by?',
    audience: 'all',
    status: 'sent',
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    recipient_count: 127,
    delivered_count: 124,
    reply_count: 31,
  },
  {
    id: 'c3',
    name: 'Follow-up on Open Quotes',
    message: 'Just checking in on the quote we sent over! We have availability this week and would love to get your project scheduled. Any questions we can answer?',
    audience: 'qualified',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    recipient_count: 19,
    delivered_count: 0,
    reply_count: 0,
  },
]

const AUDIENCE_OPTIONS = [
  { value: 'all',       label: 'All contacts',   desc: 'Everyone who has ever reached out', count: 211, color: 'blue' },
  { value: 'open',      label: 'Open leads',      desc: 'Active conversations not yet closed', count: 47, color: 'amber' },
  { value: 'qualified', label: 'Qualified leads', desc: 'Leads marked as qualified', count: 19, color: 'emerald' },
  { value: 'past',      label: 'Past customers',  desc: 'Leads marked as Won', count: 84, color: 'violet' },
]

const AUDIENCE_COUNTS: Record<string, number> = { all: 211, open: 47, qualified: 19, past: 84 }

// Seasonal suggestions based on current month
const SEASONAL_SUGGESTIONS: Record<number, { name: string; message: string; audience: string; reason: string }[]> = {
  0: [ // January
    { name: 'New Year HVAC Check', message: "Happy New Year! Start 2025 right with a furnace tune-up. Book this month and get $25 off. Reply YES to schedule.", audience: 'past', reason: "January: peak heating season, slow booking month — great time to fill the schedule." },
    { name: 'Winter Pipe Check', message: "Freezing temps are here. A quick pipe inspection can save you thousands. We have spots open this week. Want us to come by?", audience: 'all', reason: "Frozen pipe season — plumbers see huge demand for prevention services." },
  ],
  1: [ // February
    { name: 'Valentine Plumbing Special', message: "Show your home some love this Valentine's Day! Book any plumbing service this week and get 15% off. Reply YES to claim.", audience: 'past', reason: "February is slow for trades — a promo drives bookings in the lull." },
  ],
  2: [ // March
    { name: 'Spring HVAC Tune-Up', message: "Spring is right around the corner! Get your AC ready before the heat hits. We are booking tune-ups now. Want to grab a spot?", audience: 'all', reason: "March: pre-season AC prep — best time to book before summer rush." },
    { name: 'Spring Roof Inspection', message: "Spring is the perfect time to check for winter damage on your roof. We are offering free inspections this month. Can we swing by?", audience: 'all', reason: "Post-winter roof damage season — high demand for inspections." },
  ],
  3: [ // April
    { name: 'April Drain Cleaning Push', message: "Spring showers = clogged drains. We are running a drain cleaning special this month. Want us to take a look before it becomes a problem?", audience: 'all', reason: "Heavy rain season — drainage issues spike in April." },
  ],
  4: [ // May
    { name: 'Pre-Summer AC Check', message: "Summer heat is coming fast. Make sure your AC is ready. We have a few spots left this week for tune-ups. Want one?", audience: 'all', reason: "May: last chance for pre-summer AC service before the rush." },
    { name: 'Spring Cleaning Follow-Up', message: "Spring cleaning season is here! We have availability this week and would love to help. What can we take off your list?", audience: 'open', reason: "May drives home service demand across all trades." },
  ],
  5: [ // June
    { name: 'Summer AC Emergency List', message: "Summer is here and AC calls are spiking. If your system acts up, we can get to you same-day. Save our number and reply to get on our priority list.", audience: 'past', reason: "June: AC season starts — lock in repeat customers for emergency calls." },
  ],
  6: [ // July
    { name: 'Beat the Heat Promo', message: "Staying cool this July? If your AC is struggling, we can help fast. Reply YES for priority scheduling this week.", audience: 'all', reason: "Peak AC demand — hottest month for HVAC service calls." },
  ],
  7: [ // August
    { name: 'Back to School HVAC Check', message: "School is starting up. Make sure your home is comfortable before the kids are back in full time. Want a quick AC check this week?", audience: 'past', reason: "August: families home more, comfort becomes a priority." },
  ],
  8: [ // September
    { name: 'Fall Furnace Prep', message: "Fall is coming! Get your furnace inspected before the first cold snap. We are booking now for October. Want to lock in a spot?", audience: 'all', reason: "September: pre-season furnace prep — best time to book before the rush." },
    { name: 'Roof Inspection Before Winter', message: "Before winter hits, make sure your roof is ready. We are doing pre-winter inspections this month. Can we come take a look?", audience: 'past', reason: "Pre-winter roof checks are high-demand in September." },
  ],
  9: [ // October
    { name: 'Heating Season Kickoff', message: "Temperatures are dropping! Is your heating system ready? We still have spots for tune-ups this week. Reply YES to book.", audience: 'all', reason: "October: heating season starts — highest demand month for furnace service." },
  ],
  10: [ // November
    { name: 'Holiday Plumbing Prep', message: "Hosting for the holidays? The last thing you want is a plumbing issue. Book a pre-holiday inspection this month and get peace of mind. Want to schedule?", audience: 'past', reason: "Pre-Thanksgiving rush — plumbing and HVAC both see higher demand." },
  ],
  11: [ // December
    { name: 'Year-End Thank You Blast', message: "Thank you for trusting us this year. As a valued customer, you get first access to our January specials. Reply for details!", audience: 'past', reason: "December: nurture loyal customers and prime them for January bookings." },
    { name: 'Holiday Emergency Ready', message: "Heading into the holidays, make sure your heat is working. We are offering free 15-min phone consultations this week. Reply YES to grab a slot.", audience: 'all', reason: "No-heat emergencies spike during December holidays." },
  ],
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d} days ago`
}

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'In less than 1 hour'
  if (h < 24) return `In ${h} hours`
  return `In ${Math.floor(h / 24)} days`
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS)
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const charCount = message.length
  const smsCount = Math.ceil(charCount / 160) || 1

  const currentMonth = new Date().getMonth()
  const suggestions = SEASONAL_SUGGESTIONS[currentMonth] || []
  const [showSuggestions, setShowSuggestions] = useState(true)

  function useSuggestion(s: { name: string; message: string; audience: string }) {
    setName(s.name)
    setMessage(s.message)
    setAudience(s.audience)
    setShowNew(true)
    setShowSuggestions(false)
  }

  function handleSend() {
    if (!name.trim() || !message.trim()) return
    const newCampaign: Campaign = {
      id: `c${Date.now()}`,
      name,
      message,
      audience,
      status: scheduleType === 'now' ? 'sent' : 'scheduled',
      sent_at: scheduleType === 'now' ? new Date().toISOString() : undefined,
      scheduled_at: scheduleType === 'later' && scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
        : undefined,
      recipient_count: AUDIENCE_COUNTS[audience] || 0,
      delivered_count: scheduleType === 'now' ? Math.floor((AUDIENCE_COUNTS[audience] || 0) * 0.97) : 0,
      reply_count: 0,
    }
    setCampaigns(c => [newCampaign, ...c])
    setShowNew(false)
    setName(''); setMessage(''); setAudience('all'); setScheduleType('now')
  }

  const totalSent = campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + c.recipient_count, 0)
  const totalReplies = campaigns.reduce((s, c) => s + c.reply_count, 0)
  const avgReplyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f7f8fc]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Campaigns</h1>
          <p className="text-xs text-gray-400 mt-0.5">Send broadcast SMS messages to your leads and past customers</p>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Sent', value: totalSent.toLocaleString(), icon: <Send className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Total Replies', value: totalReplies, icon: <MessageSquare className="w-4 h-4 text-violet-600" />, bg: 'bg-violet-50' },
            { label: 'Avg Reply Rate', value: `${avgReplyRate}%`, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>


        {/* Seasonal suggestions */}
        {showSuggestions && suggestions.length > 0 && !showNew && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-violet-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900">Suggested for {new Date().toLocaleString('en-US', { month: 'long' })}</p>
                  <p className="text-[11px] text-violet-500 font-medium">RecMail picks campaigns that work best this time of year</p>
                </div>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-white/50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="bg-white/70 rounded-xl border border-violet-100 p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.message}</p>
                    <p className="text-[10px] text-violet-500 mt-1.5 leading-relaxed">{s.reason}</p>
                  </div>
                  <button
                    onClick={() => useSuggestion(s)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl transition-colors flex-shrink-0 shadow-sm shadow-violet-500/30"
                  >
                    <Plus className="w-3 h-3" /> Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign list */}
        <div className="space-y-3">
          {campaigns.map(c => {
            const deliveryRate = c.recipient_count > 0 ? Math.round((c.delivered_count / c.recipient_count) * 100) : 0
            const replyRate = c.delivered_count > 0 ? Math.round((c.reply_count / c.delivered_count) * 100) : 0
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      c.status === 'sent' ? 'bg-emerald-50' : c.status === 'scheduled' ? 'bg-blue-50' : 'bg-gray-100'
                    )}>
                      {c.status === 'sent'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : c.status === 'scheduled'
                        ? <Clock className="w-4 h-4 text-blue-600" />
                        : <MessageSquare className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                      c.status === 'sent' ? 'bg-emerald-50 text-emerald-700'
                      : c.status === 'scheduled' ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                    )}>{c.status}</span>
                    <span className="text-[11px] text-gray-400">
                      {c.status === 'sent' && c.sent_at ? timeAgo(c.sent_at)
                       : c.status === 'scheduled' && c.scheduled_at ? timeUntil(c.scheduled_at)
                       : 'Draft'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
                  {[
                    { label: 'Recipients', value: c.recipient_count, icon: <Users className="w-3 h-3" /> },
                    { label: 'Delivered', value: c.status === 'sent' ? `${deliveryRate}%` : '--', icon: <CheckCircle2 className="w-3 h-3" /> },
                    { label: 'Replied', value: c.status === 'sent' ? `${replyRate}%` : '--', icon: <MessageSquare className="w-3 h-3" /> },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center gap-1.5">
                      <span className="text-gray-300">{stat.icon}</span>
                      <span className="text-[11px] font-bold text-gray-700">{stat.value}</span>
                      <span className="text-[11px] text-gray-400">{stat.label}</span>
                    </div>
                  ))}
                  <span className="ml-auto text-[10px] text-gray-300 capitalize">{AUDIENCE_OPTIONS.find(a => a.value === c.audience)?.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>{/* end left panel */}

      {/* Right: compose or detail panel */}
      <div className="w-[340px] flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        {showNew ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-bold text-gray-900">New Campaign</span>
              </div>
              <button onClick={() => setShowNew(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Campaign name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Summer promo, Follow-up blast..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Audience</label>
                <div className="space-y-1.5">
                  {AUDIENCE_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setAudience(opt.value)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between',
                        audience === opt.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                      <div>
                        <span className={cn('text-xs font-semibold', audience === opt.value ? 'text-blue-700' : 'text-gray-700')}>{opt.label}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <span className={cn('text-sm font-bold tabular-nums', audience === opt.value ? 'text-blue-600' : 'text-gray-300')}>{opt.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">Message</label>
                  <span className={cn('text-[10px] font-medium tabular-nums', charCount > 320 ? 'text-red-500' : charCount > 160 ? 'text-amber-500' : 'text-gray-400')}>
                    {charCount} chars · {smsCount} SMS
                  </span>
                </div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  placeholder="Write your message..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none" />
                <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', charCount > 320 ? 'bg-red-400' : charCount > 160 ? 'bg-amber-400' : 'bg-blue-400')}
                    style={{ width: `${Math.min((charCount / 320) * 100, 100)}%` }} />
                </div>
              </div>

              {/* SMS preview bubble */}
              {message && (
                <div className="bg-[#f2f2f7] rounded-2xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 mb-2 flex items-center gap-1"><Smartphone className="w-3 h-3" /> Preview</p>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%] shadow-sm border border-gray-100">
                      <p className="text-[11px] text-gray-800 leading-relaxed">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">When to send</label>
                <div className="flex gap-2 mb-3">
                  {(['now', 'later'] as const).map(t => (
                    <button key={t} onClick={() => setScheduleType(t)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                        scheduleType === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}>
                      {t === 'now' ? <Send className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {t === 'now' ? 'Send now' : 'Schedule'}
                    </button>
                  ))}
                </div>
                {scheduleType === 'later' && (
                  <div className="space-y-2">
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                )}
              </div>

              <button onClick={handleSend} disabled={!name.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm">
                <Send className="w-3.5 h-3.5" />
                {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">Your Audience</p>
                  <p className="text-[11px] text-violet-200">211 total contacts</p>
                </div>
              </div>
              <button
                onClick={() => setShowNew(true)}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>

            {/* Audience segments */}
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Segments</p>
              {[
                { label: 'All contacts',   count: 211, sub: 'Everyone who has reached out',   bg: 'bg-blue-50',    text: 'text-blue-600',   dot: 'bg-blue-400' },
                { label: 'Open leads',     count: 47,  sub: 'Active, not yet closed',          bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-400' },
                { label: 'Qualified',      count: 19,  sub: 'Ready to book',                   bg: 'bg-emerald-50', text: 'text-emerald-600',dot: 'bg-emerald-400' },
                { label: 'Past customers', count: 84,  sub: 'Previously won leads',            bg: 'bg-violet-50',  text: 'text-violet-600', dot: 'bg-violet-400' },
              ].map(seg => (
                <button
                  key={seg.label}
                  onClick={() => { setAudience(seg.label === 'All contacts' ? 'all' : seg.label === 'Open leads' ? 'open' : seg.label === 'Qualified' ? 'qualified' : 'past'); setShowNew(true) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', seg.bg)}>
                    <span className={cn('text-sm font-bold', seg.text)}>{seg.count}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800">{seg.label}</p>
                    <p className="text-[10px] text-gray-400">{seg.sub}</p>
                  </div>
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', seg.dot)} />
                </button>
              ))}
            </div>

            {/* Best time tip */}
            <div className="px-4 mt-auto pb-5">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-[11px] font-bold text-amber-700">Best time to send</p>
                </div>
                <p className="text-[12px] font-semibold text-gray-800">Tue–Thu, 10am–12pm</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Mid-morning weekday campaigns get 2x the reply rate of evening sends.</p>
              </div>
            </div>
          </div>
        )}
      </div>{/* end right panel */}

      </div>{/* end flex row */}
    </div>
  )
}
