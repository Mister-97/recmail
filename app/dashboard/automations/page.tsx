'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Clock, CheckCircle2, Zap, XCircle, Moon, Users, Star,
  ChevronDown, ChevronUp, Plus, Trash2, Calendar, Bell, FileText, AlertTriangle, Shield, Check,
} from 'lucide-react'

type AutomationType =
  | 'follow_up'
  | 'appointment_confirm'
  | 'drip'
  | 'auto_qualify'
  | 'auto_close'
  | 'after_hours'
  | 'round_robin'
  | 'review_request'
  | 'no_show_prevention'
  | 'quote_followup'
  | 'emergency_mode'
  | 'estimate_request'
  | 'competitor_save'

type Automation = {
  type: AutomationType
  enabled: boolean
  expanded: boolean
}

const INITIAL: Automation[] = [
  { type: 'follow_up',           enabled: true,  expanded: false },
  { type: 'appointment_confirm', enabled: true,  expanded: false },
  { type: 'drip',                enabled: false, expanded: false },
  { type: 'auto_qualify',        enabled: false, expanded: false },
  { type: 'auto_close',          enabled: false, expanded: false },
  { type: 'after_hours',         enabled: false, expanded: false },
  { type: 'round_robin',         enabled: false, expanded: false },
  { type: 'review_request',      enabled: false, expanded: false },
  { type: 'no_show_prevention',  enabled: false, expanded: false },
  { type: 'quote_followup',      enabled: false, expanded: false },
  { type: 'emergency_mode',      enabled: false, expanded: false },
  { type: 'estimate_request',    enabled: false, expanded: false },
  { type: 'competitor_save',     enabled: false, expanded: false },
]

type DripStep = { delay_hours: number; message: string }

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(INITIAL)

  // Follow-up config
  const [followUpDelay, setFollowUpDelay] = useState('24')
  const [followUpMsg, setFollowUpMsg] = useState(
    "Hey! Just checking in. We would love to help. What is the best time to reach you?"
  )

  // Appointment confirm config
  const [confirmMsg, setConfirmMsg] = useState(
    "You are all set! Your appointment is confirmed. We will see you at the scheduled time. Reply STOP to cancel."
  )

  // Drip steps
  const [dripSteps, setDripSteps] = useState<DripStep[]>([
    { delay_hours: 2,  message: "Hey! Still interested in getting help? We have availability this week." },
    { delay_hours: 24, message: "Just a quick follow up. Our team is ready when you are. What works best for you?" },
    { delay_hours: 72, message: "Last check in from us. If you need help anytime, just reply here." },
  ])

  // Auto-qualify keywords
  const [keywords, setKeywords] = useState(['urgent', 'asap', 'emergency', 'today', 'now'])
  const [newKeyword, setNewKeyword] = useState('')

  // Auto-close config
  const [closeDays, setCloseDays] = useState('7')

  // After-hours config
  const [ahStartHour, setAhStartHour] = useState('6')
  const [ahStartAmPm, setAhStartAmPm] = useState('pm')
  const [ahEndHour, setAhEndHour] = useState('8')
  const [ahEndAmPm, setAhEndAmPm] = useState('am')
  const [ahMsg, setAhMsg] = useState(
    "Thanks for reaching out! Our office is currently closed but we will get back to you first thing in the morning."
  )

  // Round-robin phones
  const [rrPhones, setRrPhones] = useState(['+18175550001', '+18175550002'])
  const [newPhone, setNewPhone] = useState('')

  // No-show prevention
  const [noShowMsg, setNoShowMsg] = useState(
    "Quick reminder. Your appointment is coming up today. Our tech will be there at the scheduled time. Reply CANCEL if you need to reschedule."
  )

  // Quote follow-up
  const [quoteDelay, setQuoteDelay] = useState('48')
  const [quoteMsg, setQuoteMsg] = useState(
    "Hey! Just checking in on the quote we sent over. We have availability this week and would love to get you scheduled. Any questions?"
  )

  // Emergency mode keywords
  const [emergencyKeywords, setEmergencyKeywords] = useState(['emergency', 'flooding', 'fire', 'gas leak', 'no heat', 'no power', 'burst pipe'])
  const [newEmergencyKw, setNewEmergencyKw] = useState('')
  const [emergencyMsg, setEmergencyMsg] = useState(
    "This sounds urgent! We are getting someone to you as fast as possible. Can you confirm your address so we can dispatch right away?"
  )

  // Estimate request
  const [estimateFields, setEstimateFields] = useState(['Service type', 'Property address', 'Best time to visit', 'Any photos of the issue'])

  // Competitor save
  const [competitorNames, setCompetitorNames] = useState(['competitor', 'other company', 'another guy', 'cheaper', 'someone else'])
  const [newCompetitor, setNewCompetitor] = useState('')
  const [competitorMsg, setCompetitorMsg] = useState(
    "We totally understand wanting to compare options. Just so you know, we offer a price match guarantee and have been serving this area for over 10 years. Can we earn your business?"
  )

  // Review request
  const [reviewDelay, setReviewDelay] = useState('48')
  const [reviewUrl, setReviewUrl] = useState('')
  const [reviewMsg, setReviewMsg] = useState(
    "Thanks for choosing us! We hope everything went well. Would you mind leaving us a quick review? {review_url}"
  )

  const [toast, setToast] = useState<string | null>(null)
  const [selected, setSelected] = useState<AutomationType>('follow_up')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function toggle(type: AutomationType) {
    const current = automations.find(a => a.type === type)!
    const enabling = !current.enabled
    setAutomations(a => a.map(x => x.type === type ? { ...x, enabled: enabling, expanded: enabling ? true : x.expanded } : x))
    showToast(enabling ? 'Automation enabled' : 'Automation paused')
  }

  function toggleExpand(type: AutomationType) {
    setAutomations(a => a.map(x => x.type === type ? { ...x, expanded: !x.expanded } : x))
  }

  const get = (type: AutomationType) => automations.find(a => a.type === type)!

  const CONFIGS: Record<AutomationType, {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    label: string
    description: string
    badge?: string
    badgeColor?: string
  }> = {
    follow_up: {
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
      label: 'Follow-up Reminder',
      description: 'Automatically send a follow-up message if a lead goes silent after your first outreach.',
      badge: 'Active on 3 leads', badgeColor: 'bg-blue-50 text-blue-600',
    },
    appointment_confirm: {
      icon: <Calendar className="w-5 h-5" />,
      iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
      label: 'Appointment Confirmation',
      description: 'Send an automatic SMS confirmation the moment an appointment is booked.',
      badge: 'Active', badgeColor: 'bg-emerald-50 text-emerald-600',
    },
    drip: {
      icon: <Zap className="w-5 h-5" />,
      iconBg: 'bg-violet-50', iconColor: 'text-violet-600',
      label: 'Drip Sequence',
      description: 'Send a series of timed messages to nurture leads that haven\'t booked yet.',
    },
    auto_qualify: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
      label: 'Auto-Qualify',
      description: 'Automatically move leads to Qualified when the AI detects urgency keywords.',
    },
    auto_close: {
      icon: <XCircle className="w-5 h-5" />,
      iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
      label: 'Auto-Close',
      description: 'Close leads that have had no activity after a set number of days.',
    },
    after_hours: {
      icon: <Moon className="w-5 h-5" />,
      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
      label: 'After-Hours Mode',
      description: 'Send a different message when leads call outside your business hours.',
    },
    round_robin: {
      icon: <Users className="w-5 h-5" />,
      iconBg: 'bg-pink-50', iconColor: 'text-pink-600',
      label: 'Round-Robin Assignment',
      description: 'Alert your staff by SMS when a hot lead comes in, rotating through your team.',
    },
    review_request: {
      icon: <Star className="w-5 h-5" />,
      iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600',
      label: 'Review Request',
      description: 'Automatically ask for a Google review after a job is marked as Won.',
    },
    no_show_prevention: {
      icon: <Bell className="w-5 h-5" />,
      iconBg: 'bg-orange-50', iconColor: 'text-orange-600',
      label: 'No-Show Prevention',
      description: 'Send an automatic reminder 2 hours before a scheduled appointment to cut no-shows.',
    },
    quote_followup: {
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600',
      label: 'Quote Follow-up',
      description: 'If a lead gets quoted but does not book, follow up automatically after a set delay.',
    },
    emergency_mode: {
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: 'bg-red-50', iconColor: 'text-red-600',
      label: 'Emergency Mode',
      description: 'Switch to a faster, more urgent AI tone when keywords like flooding or no heat are detected.',
    },
    estimate_request: {
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-teal-50', iconColor: 'text-teal-600',
      label: 'Estimate Request Flow',
      description: 'AI collects everything needed for a quote before a human touches the conversation.',
    },
    competitor_save: {
      icon: <Shield className="w-5 h-5" />,
      iconBg: 'bg-rose-50', iconColor: 'text-rose-600',
      label: 'Competitor Save Sequence',
      description: 'Detects when a customer mentions a competitor and automatically fires a targeted retention message.',
    },
  }

  const DETAILS: Record<AutomationType, {
    trigger: string
    action: string
    preview: { direction: 'in' | 'out'; text: string }[]
    stats: { label: string; value: string }[]
  }> = {
    follow_up: {
      trigger: 'Lead goes silent for the configured hours after first outreach',
      action: 'Sends one follow-up SMS automatically. Stops if they reply.',
      preview: [
        { direction: 'out', text: "Hi! You just called ProAir and we missed you. What can we help with today?" },
        { direction: 'in', text: '(no reply for 24 hours)' },
        { direction: 'out', text: followUpMsg },
      ],
      stats: [{ label: 'Sent this month', value: '14' }, { label: 'Reply rate', value: '38%' }, { label: 'Leads recovered', value: '5' }],
    },
    appointment_confirm: {
      trigger: 'An appointment is booked from the summary panel',
      action: 'Instantly sends an SMS confirmation to the customer.',
      preview: [
        { direction: 'in', text: 'Thursday morning works for me. See you then!' },
        { direction: 'out', text: confirmMsg },
      ],
      stats: [{ label: 'Sent this month', value: '9' }, { label: 'No-show rate', value: '4%' }, { label: 'Avg vs no confirm', value: '−22%' }],
    },
    drip: {
      trigger: 'Lead is contacted but hasn\'t booked after the first reply',
      action: `Sends ${dripSteps.length} timed messages to re-engage them over time.`,
      preview: [
        { direction: 'out', text: dripSteps[0]?.message ?? '' },
        { direction: 'in', text: '(no reply)' },
        { direction: 'out', text: dripSteps[1]?.message ?? '' },
      ],
      stats: [{ label: 'Sequences active', value: '3' }, { label: 'Conversion rate', value: '22%' }, { label: 'Avg steps to book', value: '1.8' }],
    },
    auto_qualify: {
      trigger: `Customer message contains urgency keywords like "${keywords.slice(0, 2).join(', ')}"`,
      action: 'Automatically moves the lead to Qualified status in the inbox.',
      preview: [
        { direction: 'in', text: 'My AC is out and I have elderly parents at home. This is urgent.' },
        { direction: 'out', text: '🔔 Lead auto-qualified and moved to Qualified tab.' },
      ],
      stats: [{ label: 'Auto-qualified', value: '11' }, { label: 'Accuracy', value: '94%' }, { label: 'Time saved', value: '~2 hrs' }],
    },
    auto_close: {
      trigger: `No activity on a conversation for ${closeDays} days`,
      action: 'Moves the conversation to Closed and sends an optional final message.',
      preview: [
        { direction: 'out', text: 'Just wanted to check one last time — are you still looking for help? No worries if not!' },
        { direction: 'in', text: '(no reply for 7 days)' },
        { direction: 'out', text: '🔒 Conversation auto-closed.' },
      ],
      stats: [{ label: 'Closed this month', value: '8' }, { label: 'Inbox kept clean', value: '✓' }, { label: 'Reopened', value: '1' }],
    },
    after_hours: {
      trigger: `Missed call comes in outside business hours (after ${ahStartHour}${ahStartAmPm} or before ${ahEndHour}${ahEndAmPm})`,
      action: 'Sends a warm after-hours message and sets expectations for next morning.',
      preview: [
        { direction: 'in', text: '(Missed call at 9:42 PM)' },
        { direction: 'out', text: ahMsg },
      ],
      stats: [{ label: 'After-hours calls', value: '41%' }, { label: 'Kept vs lost', value: '+19 leads' }, { label: 'Morning converts', value: '61%' }],
    },
    round_robin: {
      trigger: 'A lead is marked as Qualified',
      action: 'Sends an SMS alert to the next staff member in rotation with lead details.',
      preview: [
        { direction: 'out', text: `🔔 New qualified lead: James Martinez — "AC stopped working, kids at home." Reply CLAIM to take it.` },
      ],
      stats: [{ label: 'Alerts sent', value: '19' }, { label: 'Claimed < 5 min', value: '84%' }, { label: 'Staff on rotation', value: `${rrPhones.length}` }],
    },
    review_request: {
      trigger: `Job is marked Won, then ${reviewDelay} hours pass`,
      action: 'Sends a friendly review request with your Google link.',
      preview: [
        { direction: 'in', text: 'Payment received, all done. Thanks!' },
        { direction: 'out', text: reviewMsg.replace('{review_url}', reviewUrl || 'g.page/r/your-link') },
      ],
      stats: [{ label: 'Requests sent', value: '11' }, { label: 'Reviews received', value: '7' }, { label: 'Conversion', value: '64%' }],
    },
    no_show_prevention: {
      trigger: '2 hours before a scheduled appointment time',
      action: 'Sends an automated reminder to reduce no-shows.',
      preview: [
        { direction: 'out', text: noShowMsg },
        { direction: 'in', text: 'Got it, we will be home. Thank you!' },
      ],
      stats: [{ label: 'Reminders sent', value: '9' }, { label: 'No-show rate', value: '4%' }, { label: 'vs industry avg', value: '−18%' }],
    },
    quote_followup: {
      trigger: `Lead is in Quoted stage with no booking after ${quoteDelay} hours`,
      action: 'Sends a friendly nudge to bring them back.',
      preview: [
        { direction: 'in', text: '(Quote sent, no reply for 48 hours)' },
        { direction: 'out', text: quoteMsg },
        { direction: 'in', text: 'Sorry just saw this! Yes lets book for Friday' },
      ],
      stats: [{ label: 'Sent this month', value: '7' }, { label: 'Booked after nudge', value: '3' }, { label: 'Revenue saved', value: '$1,350' }],
    },
    emergency_mode: {
      trigger: `Message contains emergency keywords like "${emergencyKeywords.slice(0, 2).join(', ')}"`,
      action: 'Overrides the default AI tone with an urgent, action-focused response.',
      preview: [
        { direction: 'in', text: 'Water is coming through my ceiling right now!! This is an emergency' },
        { direction: 'out', text: emergencyMsg },
      ],
      stats: [{ label: 'Triggered', value: '6' }, { label: 'Same-day dispatch', value: '5' }, { label: 'Avg response', value: '< 8 sec' }],
    },
    estimate_request: {
      trigger: 'Customer asks for a quote or estimate',
      action: 'AI collects service type, address, photos, and availability before handing off.',
      preview: [
        { direction: 'in', text: 'How much would it cost to replace my water heater?' },
        { direction: 'out', text: 'Happy to help with that! To give you an accurate quote, could you tell me: 1) Your property address, and 2) The type/size of your current water heater?' },
        { direction: 'in', text: '123 Oak Lane, it is a 40 gallon gas unit' },
        { direction: 'out', text: 'Got it! Last question — when would be a good time for a tech to come take a look?' },
      ],
      stats: [{ label: 'Quotes collected', value: '12' }, { label: 'Human time saved', value: '~4 hrs' }, { label: 'Booked rate', value: '58%' }],
    },
    competitor_save: {
      trigger: `Customer mentions a competitor or phrase like "${competitorNames[0]}"`,
      action: 'Fires a retention message automatically to keep the lead.',
      preview: [
        { direction: 'in', text: 'I got a quote from another company that was cheaper' },
        { direction: 'out', text: competitorMsg },
        { direction: 'in', text: 'Ok fair enough, lets go with you guys' },
      ],
      stats: [{ label: 'Triggered', value: '4' }, { label: 'Saves', value: '3' }, { label: 'Save rate', value: '75%' }],
    },
  }

  const activeCount = automations.filter(a => a.enabled).length
  const totalCount = automations.length

  const GROUPS: { label: string; description: string; types: AutomationType[] }[] = [
    {
      label: 'Core',
      description: 'Essential automations for every business',
      types: ['follow_up', 'appointment_confirm', 'after_hours', 'auto_close'],
    },
    {
      label: 'Lead Nurture',
      description: 'Keep leads warm and moving through the pipeline',
      types: ['drip', 'quote_followup', 'no_show_prevention', 'review_request'],
    },
    {
      label: 'Lead Intelligence',
      description: 'Smart detection and routing for high-value situations',
      types: ['auto_qualify', 'emergency_mode', 'estimate_request', 'competitor_save', 'round_robin'],
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f7f8fc]">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Automations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Automatic actions that run without you lifting a finger</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            {activeCount} active
          </span>
          <span className="text-xs text-gray-400">{totalCount - activeCount} paused</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: automation list */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">

        {GROUPS.map(group => (
          <div key={group.label}>
            <div className="mb-3">
              <h2 className="text-[13px] font-bold text-gray-800">{group.label}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{group.description}</p>
            </div>
            <div className="space-y-3">
        {group.types.map((type) => {
          const cfg = CONFIGS[type]
          const auto = get(type)

          return (
            <div
              key={type}
              onClick={() => setSelected(type)}
              className={cn(
                'bg-white rounded-2xl border transition-all duration-200 cursor-pointer',
                selected === type
                  ? 'border-blue-300 shadow-md ring-1 ring-blue-100'
                  : auto.enabled
                  ? 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                  : 'border-gray-100 hover:border-gray-200 opacity-75 hover:opacity-100',
              )}
            >
              {/* Card header */}
              <div className="flex items-center gap-3.5 p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.iconBg, cfg.iconColor)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">{cfg.label}</span>
                    {auto.enabled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed truncate">{cfg.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {auto.enabled && (
                    <button
                      onClick={() => toggleExpand(type)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      {auto.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(type)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
                      auto.enabled ? 'bg-blue-500' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200',
                      auto.enabled ? 'left-[22px]' : 'left-0.5'
                    )} />
                  </button>
                </div>
              </div>

              {/* Config panel */}
              {auto.enabled && auto.expanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 rounded-b-2xl space-y-4">

                  {/* ── Follow-up ── */}
                  {type === 'follow_up' && (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">Send after</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={followUpDelay} onChange={e => setFollowUpDelay(e.target.value)}
                            className="w-16 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-semibold" />
                          <span className="text-xs text-gray-500">hours of no reply</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
                        <textarea value={followUpMsg} onChange={e => setFollowUpMsg(e.target.value)} rows={2}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                      </div>
                    </>
                  )}

                  {/* ── Appointment Confirm ── */}
                  {type === 'appointment_confirm' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Confirmation message</label>
                      <textarea value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)} rows={2}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                      <p className="text-[10px] text-gray-400 mt-1.5">Sent automatically when an appointment is booked from the summary panel.</p>
                    </div>
                  )}

                  {/* ── Drip sequence ── */}
                  {type === 'drip' && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-600">Steps</label>
                      {dripSteps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start bg-white border border-gray-200 rounded-xl p-3">
                          <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Send after</span>
                              <input type="number" value={step.delay_hours}
                                onChange={e => setDripSteps(s => s.map((x, j) => j === i ? { ...x, delay_hours: +e.target.value } : x))}
                                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-center font-semibold focus:outline-none" />
                              <span className="text-xs text-gray-500">hours</span>
                            </div>
                            <textarea value={step.message} rows={2}
                              onChange={e => setDripSteps(s => s.map((x, j) => j === i ? { ...x, message: e.target.value } : x))}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
                          </div>
                          <button onClick={() => setDripSteps(s => s.filter((_, j) => j !== i))}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setDripSteps(s => [...s, { delay_hours: 48, message: '' }])}
                        className="flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add step
                      </button>
                    </div>
                  )}

                  {/* ── Auto-qualify ── */}
                  {type === 'auto_qualify' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Trigger keywords</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {keywords.map(kw => (
                          <span key={kw} className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                            {kw}
                            <button onClick={() => setKeywords(k => k.filter(x => x !== kw))} className="text-amber-400 hover:text-amber-600">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                          placeholder="Add keyword…"
                          onKeyDown={e => { if (e.key === 'Enter' && newKeyword.trim()) { setKeywords(k => [...k, newKeyword.trim()]); setNewKeyword('') } }}
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                        <button onClick={() => { if (newKeyword.trim()) { setKeywords(k => [...k, newKeyword.trim()]); setNewKeyword('') } }}
                          className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors">
                          Add
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">When any of these words appear in a lead's message, they're auto-moved to Qualified.</p>
                    </div>
                  )}

                  {/* ── Auto-close ── */}
                  {type === 'auto_close' && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">Close after</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={closeDays} onChange={e => setCloseDays(e.target.value)}
                          className="w-16 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-semibold" />
                        <span className="text-xs text-gray-500">days of no reply</span>
                      </div>
                    </div>
                  )}

                  {/* ── After hours ── */}
                  {type === 'after_hours' && (
                    <>
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">Business hours</label>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <select value={ahEndHour} onChange={e => setAhEndHour(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs">
                            {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                              <option key={h} value={String(h)}>{h}</option>
                            ))}
                          </select>
                          <select value={ahEndAmPm} onChange={e => setAhEndAmPm(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs">
                            <option value="am">AM</option>
                            <option value="pm">PM</option>
                          </select>
                          <span className="text-gray-400">to</span>
                          <select value={ahStartHour} onChange={e => setAhStartHour(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs">
                            {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                              <option key={h} value={String(h)}>{h}</option>
                            ))}
                          </select>
                          <select value={ahStartAmPm} onChange={e => setAhStartAmPm(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs">
                            <option value="am">AM</option>
                            <option value="pm">PM</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">After-hours message</label>
                        <textarea value={ahMsg} onChange={e => setAhMsg(e.target.value)} rows={2}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                      </div>
                    </>
                  )}

                  {/* ── Round-robin ── */}
                  {type === 'round_robin' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Staff phone numbers</label>
                      <div className="space-y-2 mb-2">
                        {rrPhones.map((ph, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <input value={ph} onChange={e => setRrPhones(p => p.map((x, j) => j === i ? e.target.value : x))}
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20" />
                            <button onClick={() => setRrPhones(p => p.filter((_, j) => j !== i))}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                          placeholder="+1 (817) 555-0000"
                          onKeyDown={e => { if (e.key === 'Enter' && newPhone.trim()) { setRrPhones(p => [...p, newPhone.trim()]); setNewPhone('') } }}
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20" />
                        <button onClick={() => { if (newPhone.trim()) { setRrPhones(p => [...p, newPhone.trim()]); setNewPhone('') } }}
                          className="text-xs font-semibold bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Each new qualified lead sends an SMS alert to the next person in rotation.</p>
                    </div>
                  )}

                  {/* ── No-show prevention ── */}
                  {type === 'no_show_prevention' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Reminder message <span className="text-gray-400 font-normal">(sent 2 hours before)</span></label>
                      <textarea value={noShowMsg} onChange={e => setNoShowMsg(e.target.value)} rows={3}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
                      <p className="text-[10px] text-gray-400 mt-1.5">Automatically fires 2 hours before any booked appointment. Replies go to the conversation.</p>
                    </div>
                  )}

                  {/* ── Quote follow-up ── */}
                  {type === 'quote_followup' && (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">Follow up after</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={quoteDelay} onChange={e => setQuoteDelay(e.target.value)}
                            className="w-16 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-center font-semibold" />
                          <span className="text-xs text-gray-500">hours with no booking</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
                        <textarea value={quoteMsg} onChange={e => setQuoteMsg(e.target.value)} rows={3}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none" />
                      </div>
                    </>
                  )}

                  {/* ── Emergency mode ── */}
                  {type === 'emergency_mode' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-2">Emergency trigger keywords</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {emergencyKeywords.map(kw => (
                            <span key={kw} className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                              {kw}
                              <button onClick={() => setEmergencyKeywords(k => k.filter(x => x !== kw))} className="text-red-400 hover:text-red-600">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={newEmergencyKw} onChange={e => setNewEmergencyKw(e.target.value)}
                            placeholder="Add keyword..."
                            onKeyDown={e => { if (e.key === 'Enter' && newEmergencyKw.trim()) { setEmergencyKeywords(k => [...k, newEmergencyKw.trim()]); setNewEmergencyKw('') } }}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                          <button onClick={() => { if (newEmergencyKw.trim()) { setEmergencyKeywords(k => [...k, newEmergencyKw.trim()]); setNewEmergencyKw('') } }}
                            className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors">Add</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Emergency response message</label>
                        <textarea value={emergencyMsg} onChange={e => setEmergencyMsg(e.target.value)} rows={2}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none" />
                        <p className="text-[10px] text-gray-400 mt-1.5">This replaces the normal first reply when an emergency keyword is detected.</p>
                      </div>
                    </>
                  )}

                  {/* ── Estimate request ── */}
                  {type === 'estimate_request' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Info to collect before handoff</label>
                      <div className="space-y-2 mb-2">
                        {estimateFields.map((field, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</div>
                            <input value={field} onChange={e => setEstimateFields(f => f.map((x, j) => j === i ? e.target.value : x))}
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                            <button onClick={() => setEstimateFields(f => f.filter((_, j) => j !== i))}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setEstimateFields(f => [...f, ''])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add field
                      </button>
                      <p className="text-[10px] text-gray-400 mt-2">The AI asks for each item in sequence before flagging the lead as ready for a human quote.</p>
                    </div>
                  )}

                  {/* ── Competitor save ── */}
                  {type === 'competitor_save' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-2">Trigger phrases</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {competitorNames.map(name => (
                            <span key={name} className="flex items-center gap-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full">
                              {name}
                              <button onClick={() => setCompetitorNames(n => n.filter(x => x !== name))} className="text-rose-400 hover:text-rose-600">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={newCompetitor} onChange={e => setNewCompetitor(e.target.value)}
                            placeholder="Add phrase…"
                            onKeyDown={e => { if (e.key === 'Enter' && newCompetitor.trim()) { setCompetitorNames(n => [...n, newCompetitor.trim()]); setNewCompetitor('') } }}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20" />
                          <button onClick={() => { if (newCompetitor.trim()) { setCompetitorNames(n => [...n, newCompetitor.trim()]); setNewCompetitor('') } }}
                            className="text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg transition-colors">Add</button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">When a customer mentions any of these phrases, the save message fires automatically.</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Save message</label>
                        <textarea value={competitorMsg} onChange={e => setCompetitorMsg(e.target.value)} rows={3}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" />
                      </div>
                    </>
                  )}

                  {/* ── Review request ── */}
                  {type === 'review_request' && (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-gray-600 w-32 flex-shrink-0">Send after</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={reviewDelay} onChange={e => setReviewDelay(e.target.value)}
                            className="w-16 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center font-semibold" />
                          <span className="text-xs text-gray-500">hours after job marked Won</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Your Google review link</label>
                        <input value={reviewUrl} onChange={e => setReviewUrl(e.target.value)}
                          placeholder="https://g.page/r/your-review-link"
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Message</label>
                        <textarea value={reviewMsg} onChange={e => setReviewMsg(e.target.value)} rows={2}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        <p className="text-[10px] text-gray-400 mt-1">Use <code className="bg-gray-100 px-1 rounded text-gray-500">{'{review_url}'}</code> to insert your link.</p>
                      </div>
                    </>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => showToast('Automation saved')}
                      className="text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
            </div>
          </div>
        ))}
        </div>

        {/* Right: detail panel */}
        {(() => {
          const cfg = CONFIGS[selected]
          const detail = DETAILS[selected]
          const auto = get(selected)
          return (
            <div className="w-[340px] flex-shrink-0 border-l border-gray-200 bg-[#f7f8fc] overflow-y-auto">
            <div className="flex flex-col gap-3 p-4">

              {/* Header card */}
              <div className={cn('rounded-2xl p-4 flex flex-col gap-3', cfg.iconBg)}>
                <div className="flex items-start justify-between">
                  <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm bg-white/60', cfg.iconColor)}>
                    {cfg.icon}
                  </div>
                  <span className={cn(
                    'text-[11px] font-bold px-3 py-1 rounded-full',
                    auto.enabled ? 'bg-emerald-500 text-white' : 'bg-white/60 text-gray-500'
                  )}>
                    {auto.enabled ? '● Active' : '○ Paused'}
                  </span>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">{cfg.label}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{cfg.description}</p>
                </div>
              </div>

              {/* SMS preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-gray-700">Message Preview</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">SMS</span>
                </div>
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-4 space-y-2.5">
                  {detail.preview.map((msg, i) => (
                    msg.text.startsWith('(') ? (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-300/60" />
                        <p className="text-[10px] text-slate-400 italic">{msg.text}</p>
                        <div className="flex-1 h-px bg-slate-300/60" />
                      </div>
                    ) : msg.direction === 'out' ? (
                      <div key={i} className="flex justify-end">
                        <div className="bg-blue-500 text-white text-[12px] leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[88%] shadow-sm">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-start">
                        <div className="bg-white text-gray-800 text-[12px] leading-relaxed rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[88%] shadow-sm border border-gray-200">
                          {msg.text}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Trigger → Action flow */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                    </div>
                    <div className="w-px flex-1 bg-gray-100 min-h-[16px]" />
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Trigger</p>
                      <p className="text-[12px] text-gray-700 leading-relaxed">{detail.trigger}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Action</p>
                      <p className="text-[12px] text-gray-700 leading-relaxed">{detail.action}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>{/* inner flex col */}
            </div>
          )
        })()}

      </div>
    </div>
  )
}
