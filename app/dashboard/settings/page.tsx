'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Save, CheckCircle2, AlertCircle, Building2, Phone, Brain, Clock, Bell, Webhook, CreditCard, Unlink, ExternalLink, Search, Loader2, Hash, Gift, Copy, Users, DollarSign, TrendingUp, Share2 } from 'lucide-react'
import RoiWidget from '@/components/RoiWidget'

type Tab = 'business' | 'ai' | 'hours' | 'notifications' | 'integrations' | 'billing' | 'referrals'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'business',      label: 'Business',      icon: <Building2 className="w-4 h-4" /> },
  { id: 'ai',            label: 'AI Settings',   icon: <Brain className="w-4 h-4" /> },
  { id: 'hours',         label: 'Business Hours',icon: <Clock className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'integrations',  label: 'Integrations',  icon: <Webhook className="w-4 h-4" /> },
  { id: 'billing',       label: 'Billing',       icon: <CreditCard className="w-4 h-4" /> },
  { id: 'referrals',     label: 'Referrals',     icon: <Gift className="w-4 h-4" /> },
]

const MOCK_REFERRAL_CODE = 'PROAIR-X4K2'
const MOCK_REFERRALS = [
  { name: 'Fort Worth Plumbing Co.', status: 'active', since: 'Mar 2026', commission: 9.90 },
  { name: 'Dallas Roofing Pros',     status: 'active', since: 'Apr 2026', commission: 9.90 },
  { name: 'Saginaw Electric',        status: 'pending', since: 'May 2026', commission: 0 },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12
  const ampm = i < 12 ? 'AM' : 'PM'
  return { value: String(i).padStart(2, '0') + ':00', label: `${h}:00 ${ampm}` }
})

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold z-50 animate-in slide-in-from-bottom-4 duration-200',
      ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('business')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  // Business
  const [businessName, setBusinessName] = useState('ProAir HVAC')
  const [twilioNumber, setTwilioNumber] = useState('+18175550000')
  const [ownerPhone, setOwnerPhone] = useState('+18175559999')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [depositAmount, setDepositAmount] = useState('75')
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState('')

  // AI
  const [promptOverride, setPromptOverride] = useState('')
  const [priceList, setPriceList] = useState('')
  const [aiModel, setAiModel] = useState('flash')
  const [maxTurns, setMaxTurns] = useState('8')
  const [summaryTrigger, setSummaryTrigger] = useState('6')

  // Hours
  const [hours, setHours] = useState(
    DAYS.map((day, i) => ({
      day,
      open: i < 5,
      start: '08:00',
      end: '18:00',
    }))
  )

  // Notifications
  const [notifyNewLead, setNotifyNewLead] = useState(true)
  const [notifyQualified, setNotifyQualified] = useState(true)
  const [notifyMorningBrief, setNotifyMorningBrief] = useState(true)
  const [notifyMonthlyRoi, setNotifyMonthlyRoi] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)

  // Phone provisioning
  const [areaCodeInput, setAreaCodeInput] = useState('')
  const [searchingNumbers, setSearchingNumbers] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<{ phone_number: string; friendly_name: string; locality: string; region: string }[]>([])
  const [provisioningNumber, setProvisioningNumber] = useState<string | null>(null)
  const [numberProvisioned, setNumberProvisioned] = useState(false)

  async function searchNumbers() {
    if (areaCodeInput.length !== 3) return
    setSearchingNumbers(true)
    setAvailableNumbers([])
    try {
      const res = await fetch(`/api/twilio/numbers/search?area_code=${areaCodeInput}`)
      const data = await res.json()
      setAvailableNumbers(data.numbers ?? [])
    } catch {
      showToast('Failed to search numbers', false)
    } finally {
      setSearchingNumbers(false)
    }
  }

  async function provisionNumber(phoneNumber: string) {
    setProvisioningNumber(phoneNumber)
    try {
      const res = await fetch('/api/twilio/numbers/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      })
      if (!res.ok) throw new Error()
      setTwilioNumber(phoneNumber)
      setNumberProvisioned(true)
      setAvailableNumbers([])
      showToast(`${phoneNumber} is now your RecMail number!`)
    } catch {
      showToast('Failed to provision number', false)
    } finally {
      setProvisioningNumber(null)
    }
  }

  // Slack
  const [slackConnected, setSlackConnected] = useState(false)
  const [slackChannel, setSlackChannel] = useState('')
  const [slackWorkspace, setSlackWorkspace] = useState('')

  // Referrals
  const [copied, setCopied] = useState(false)
  function copyReferralLink() {
    navigator.clipboard.writeText(`https://recmail.io/signup?ref=${MOCK_REFERRAL_CODE}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Integrations
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackTrigger, setSlackTrigger] = useState<'all' | 'qualified'>('qualified')
  const [reviewUrl, setReviewUrl] = useState('')

  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && TABS.find(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }

    const stripeParam = searchParams.get('stripe')
    if (stripeParam === 'connected') {
      setStripeConnected(true)
      setActiveTab('integrations')
      showToast('Stripe connected successfully!')
    } else if (stripeParam === 'error') {
      showToast(searchParams.get('msg') ?? 'Stripe connection failed', false)
    }

    const slackParam = searchParams.get('slack')
    if (slackParam === 'connected') {
      setSlackConnected(true)
      setSlackChannel(searchParams.get('channel') ?? '')
      setSlackWorkspace(searchParams.get('workspace') ?? '')
      setActiveTab('integrations')
      showToast('Slack connected successfully!')
    } else if (slackParam === 'error') {
      showToast(searchParams.get('msg') ?? 'Slack connection failed', false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    showToast('Settings saved!')
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
  const labelCls = "text-xs font-semibold text-gray-600 block mb-1.5"
  const sectionCls = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#f7f8fc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">Configure your RecMail account</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left nav */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 py-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50 border-r-2 border-r-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}>
              <span className={activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-4">

            {/* Business */}
            {activeTab === 'business' && (
              <>
                <div className={sectionCls}>
                  <h2 className="text-sm font-bold text-gray-900">Business Info</h2>
                  <div>
                    <label className={labelCls}>Business name</label>
                    <input value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>RecMail number</label>
                      {twilioNumber ? (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-800 flex-1">{twilioNumber}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-200 rounded-xl px-3 py-2.5">
                          <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <span className="text-sm text-gray-400">No number yet — use the picker below</span>
                        </div>
                      )}
                      {twilioNumber && <p className="text-[10px] text-gray-400 mt-1">Contact support to change your number.</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Owner cell (for morning brief)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className={cn(inputCls, 'pl-8')} />
                      </div>
                    </div>
                  </div>
                  {/* Phone provisioning */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-blue-700">Get a RecMail Number</p>
                      <p className="text-[11px] text-blue-600 mt-0.5">Pick a local number — everything is configured automatically.</p>
                    </div>
                    {numberProvisioned ? (
                      <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-3 py-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-gray-800">{twilioNumber}</span>
                        <span className="text-xs text-gray-400 ml-auto">Active · webhooks configured</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              value={areaCodeInput}
                              onChange={e => setAreaCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              placeholder="817"
                              maxLength={3}
                              className={cn(inputCls, 'pl-8')}
                              onKeyDown={e => e.key === 'Enter' && searchNumbers()}
                            />
                          </div>
                          <button onClick={searchNumbers} disabled={areaCodeInput.length !== 3 || searchingNumbers}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors">
                            {searchingNumbers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            Search
                          </button>
                        </div>
                        {availableNumbers.length > 0 && (
                          <div className="space-y-1.5">
                            {availableNumbers.map(n => (
                              <div key={n.phone_number} className="flex items-center justify-between bg-white border border-blue-100 rounded-xl px-3 py-2.5">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{n.friendly_name}</p>
                                  <p className="text-[11px] text-gray-400">{n.locality}, {n.region}</p>
                                </div>
                                <button
                                  onClick={() => provisionNumber(n.phone_number)}
                                  disabled={provisioningNumber !== null}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                                  {provisioningNumber === n.phone_number ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  Select
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Call forwarding guide */}
                  <div id="forwarding" className="border border-amber-100 bg-amber-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-amber-800">Set up call forwarding</p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Keep your existing business number. Forward unanswered calls to your RecMail number — RecMail catches every missed call and texts them back automatically.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-amber-100 divide-y divide-amber-50 overflow-hidden">
                      {[
                        {
                          platform: 'iPhone',
                          steps: [
                            'Open Settings → Apps → Phone → Call Forwarding',
                            'Toggle Call Forwarding on',
                            `Enter your RecMail number: ${twilioNumber || '+1 (817) 555-0000'}`,
                          ],
                        },
                        {
                          platform: 'Android',
                          steps: [
                            'Open the Phone app → tap the three-dot menu → Settings',
                            'Tap Supplementary services (or Calling Accounts) → Call forwarding',
                            'Select "Always forward"',
                            `Enter your RecMail number: ${twilioNumber || '+1 (817) 555-0000'} and turn it on`,
                          ],
                        },
                        {
                          platform: 'VoIP / Landline',
                          steps: [
                            'Access your system via the web-based user portal, desktop/mobile app, or a desk phone',
                            'Find Call Forwarding in your settings',
                            `Set the forward-to number to your RecMail number: ${twilioNumber || '+1 (817) 555-0000'}`,
                            'On a desk phone you can also dial *72 followed by your RecMail number to enable forwarding',
                          ],
                        },
                      ].map((item, i) => (
                        <details key={item.platform} className="group">
                          <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none">
                            <span className="text-xs font-semibold text-gray-700">{item.platform}</span>
                            <span className="text-[10px] text-amber-600 group-open:hidden">Show steps</span>
                            <span className="text-[10px] text-amber-600 hidden group-open:block">Hide</span>
                          </summary>
                          <ol className="px-4 pb-3 space-y-1.5">
                            {item.steps.map((step, j) => (
                              <li key={j} className="flex items-start gap-2 text-[11px] text-gray-600">
                                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </details>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-600">
                      Tip: set the ring timeout to 15–20 seconds so you still have a chance to answer before RecMail takes over.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-emerald-700">Auto-Deposit Collection</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">When a customer shows booking intent, RecMail automatically sends a Stripe payment link to collect a deposit. Zero human involvement.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Deposit amount ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                          <input type="number" min="0" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                            className={cn(inputCls, 'pl-6')} placeholder="75" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Applied to final invoice. Set to 0 to disable.</p>
                      </div>
                      <div className="flex flex-col justify-end">
                        {stripeConnected ? (
                          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-100 border border-emerald-200 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-emerald-700">Stripe connected</span>
                          </div>
                        ) : (
                          <a href="/api/stripe/connect"
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#635bff] hover:bg-[#5851e5] text-white text-xs font-semibold rounded-xl transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Connect Stripe
                          </a>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">Required for auto-deposit. Set up in Integrations tab.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Timezone</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="America/Phoenix">Arizona (no DST)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* AI */}
            {activeTab === 'ai' && (
              <div className={sectionCls}>
                <h2 className="text-sm font-bold text-gray-900">AI Configuration</h2>
                <div>
                  <label className={labelCls}>AI model</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'flash', label: 'Gemini 1.5 Flash', desc: 'Faster, cheaper — recommended for most businesses' },
                      { value: 'pro', label: 'Gemini 1.5 Pro', desc: 'Slower, smarter — best for complex service businesses' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setAiModel(opt.value)}
                        className={cn('text-left p-3 rounded-xl border transition-all',
                          aiModel === opt.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        )}>
                        <p className={cn('text-xs font-semibold', aiModel === opt.value ? 'text-blue-700' : 'text-gray-700')}>{opt.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Max conversation turns</label>
                    <input type="number" min="3" max="20" value={maxTurns} onChange={e => setMaxTurns(e.target.value)} className={inputCls} />
                    <p className="text-[10px] text-gray-400 mt-1">AI hands off after this many exchanges</p>
                  </div>
                  <div>
                    <label className={labelCls}>Trigger summary after</label>
                    <input type="number" min="2" max="15" value={summaryTrigger} onChange={e => setSummaryTrigger(e.target.value)} className={inputCls} />
                    <p className="text-[10px] text-gray-400 mt-1">turns before generating AI summary</p>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pricing the AI can share</label>
                  <textarea value={priceList} onChange={e => setPriceList(e.target.value)} rows={4}
                    placeholder={`Example:\nDiagnostic fee: $89\nAC tune-up: $129\nFurnace repair starts at $150\nEmergency after-hours call: $199`}
                    className={cn(inputCls, 'resize-none font-mono text-xs')} />
                  <p className="text-[10px] text-gray-400 mt-1">The AI will only share these if a customer directly asks for pricing. It will always note that the final quote depends on the job.</p>
                </div>
                <div>
                  <label className={labelCls}>Custom AI instructions (optional)</label>
                  <textarea value={promptOverride} onChange={e => setPromptOverride(e.target.value)} rows={5}
                    placeholder="Add extra rules for the AI. Example: Always mention our 5-star Google rating. We only serve the Fort Worth area. Do not discuss competitors."
                    className={cn(inputCls, 'resize-none')} />
                  <p className="text-[10px] text-gray-400 mt-1">These instructions are added on top of the default AI behavior. Leave blank to use RecMail defaults.</p>
                </div>
              </div>
            )}

            {/* Hours */}
            {activeTab === 'hours' && (
              <div className={sectionCls}>
                <h2 className="text-sm font-bold text-gray-900">Business Hours</h2>
                <p className="text-xs text-gray-400">Used for the After-Hours automation to send a different message outside these times.</p>
                <div className="space-y-2">
                  {hours.map((h, i) => (
                    <div key={h.day} className={cn('flex items-center gap-4 py-2.5 px-3 rounded-xl transition-all', h.open ? 'bg-white border border-gray-100' : 'bg-gray-50 border border-gray-100 opacity-60')}>
                      <div className="flex items-center gap-2 w-28">
                        <button onClick={() => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, open: !x.open } : x))}
                          className={cn('relative w-9 h-5 rounded-full transition-all', h.open ? 'bg-blue-500' : 'bg-gray-200')}>
                          <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all', h.open ? 'left-[18px]' : 'left-0.5')} />
                        </button>
                        <span className="text-xs font-medium text-gray-700">{h.day.slice(0, 3)}</span>
                      </div>
                      {h.open ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select value={h.start} onChange={e => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                            {HOURS.map(hr => <option key={hr.value} value={hr.value}>{hr.label}</option>)}
                          </select>
                          <span className="text-xs text-gray-400">to</span>
                          <select value={h.end} onChange={e => setHours(hrs => hrs.map((x, j) => j === i ? { ...x, end: e.target.value } : x))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                            {HOURS.map(hr => <option key={hr.value} value={hr.value}>{hr.label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 flex-1">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className={sectionCls}>
                <h2 className="text-sm font-bold text-gray-900">Notification Preferences</h2>
                <div className="space-y-3">
                  {[
                    { label: 'New lead alert', desc: 'Notify when a missed call starts a new conversation', value: notifyNewLead, set: setNotifyNewLead },
                    { label: 'Lead qualified', desc: 'Notify when AI moves a lead to Qualified', value: notifyQualified, set: setNotifyQualified },
                    { label: 'Morning brief SMS', desc: 'Daily SMS at 7am with your lead summary', value: notifyMorningBrief, set: setNotifyMorningBrief },
                    { label: 'Monthly ROI report', desc: 'Email on the 1st of every month with ROI stats', value: notifyMonthlyRoi, set: setNotifyMonthlyRoi },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <button onClick={() => item.set(!item.value)}
                        className={cn('relative w-11 h-6 rounded-full transition-all flex-shrink-0', item.value ? 'bg-blue-500' : 'bg-gray-200')}>
                        <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all', item.value ? 'left-[22px]' : 'left-0.5')} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Browser push notifications</p>
                      <p className="text-xs text-gray-400 mt-0.5">Get instant alerts when leads come in</p>
                    </div>
                    <button onClick={async () => {
                      if (!pushEnabled) {
                        const perm = await Notification.requestPermission()
                        setPushEnabled(perm === 'granted')
                      } else { setPushEnabled(false) }
                    }}
                      className={cn('relative w-11 h-6 rounded-full transition-all flex-shrink-0', pushEnabled ? 'bg-blue-500' : 'bg-gray-200')}>
                      <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all', pushEnabled ? 'left-[22px]' : 'left-0.5')} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <>
                <div className={sectionCls}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Slack</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Ping your team when a qualified lead comes in.</p>
                    </div>
                    {slackConnected && (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>

                  {slackConnected ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#4A154B]/10">
                          {/* Slack hash icon */}
                          <svg className="w-5 h-5 text-[#4A154B]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {slackWorkspace || 'Slack workspace'} · <span className="text-gray-500">{slackChannel || '#general'}</span>
                          </p>
                          <p className="text-[11px] text-gray-400">Alerts post to this channel when leads qualify</p>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Notify on</label>
                        <div className="flex gap-2">
                          {[{ value: 'qualified', label: 'Qualified leads only' }, { value: 'all', label: 'All new leads' }].map(opt => (
                            <button key={opt.value} onClick={() => setSlackTrigger(opt.value as 'all' | 'qualified')}
                              className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
                                slackTrigger === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              )}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <button onClick={async () => {
                          const { data: client } = await fetch('/api/settings').then(r => r.json()).catch(() => ({}))
                          showToast('Test message sent!')
                        }} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                          Send test message
                        </button>
                        <span className="text-gray-300">·</span>
                        <button onClick={async () => {
                          await fetch('/api/slack/disconnect', { method: 'POST' })
                          setSlackConnected(false)
                          setSlackChannel('')
                          setSlackWorkspace('')
                          showToast('Slack disconnected')
                        }} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700">
                          <Unlink className="w-3 h-3" /> Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-[#4A154B]/5 border border-[#4A154B]/15 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700">What you'll get</p>
                        <ul className="space-y-1.5">
                          {[
                            'Instant alert when a lead qualifies',
                            'Customer name, phone, and what they need',
                            'Link directly to the conversation in RecMail',
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <a href="/api/slack/connect"
                        className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#4A154B] hover:bg-[#3d1140] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                        </svg>
                        Add to Slack
                      </a>
                      <p className="text-[10px] text-gray-400 text-center">
                        You'll choose which channel to post to inside Slack.
                      </p>
                    </div>
                  )}
                </div>

                <div id="stripe" className={sectionCls}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Stripe</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Collect booking deposits automatically via SMS when a customer confirms.</p>
                    </div>
                    {stripeConnected && (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>

                  {stripeConnected ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#635bff]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-[#635bff]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Stripe account connected</p>
                          {stripeAccountId && <p className="text-[11px] text-gray-400 font-mono">{stripeAccountId}</p>}
                          <p className="text-[11px] text-gray-400">Deposits go directly to your Stripe balance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-3 h-3" /> Stripe Dashboard
                        </a>
                        <span className="text-gray-300">·</span>
                        <button onClick={async () => {
                          await fetch('/api/stripe/disconnect', { method: 'POST' })
                          setStripeConnected(false)
                          setStripeAccountId('')
                          showToast('Stripe disconnected')
                        }} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700">
                          <Unlink className="w-3 h-3" /> Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-[#635bff]/5 to-[#00d4ff]/5 border border-[#635bff]/20 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700">How it works</p>
                        <ul className="space-y-1.5">
                          {[
                            'Customer texts and confirms they want to book',
                            'RecMail auto-sends a Stripe checkout link via SMS',
                            'Customer pays the deposit on their phone',
                            'RecMail marks the lead as booked automatically',
                          ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                              <span className="w-4 h-4 rounded-full bg-[#635bff]/10 text-[#635bff] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <a href="/api/stripe/connect"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-[#635bff] hover:bg-[#5851e5] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                        <CreditCard className="w-4 h-4" />
                        Connect with Stripe
                      </a>
                      <p className="text-[10px] text-gray-400 text-center">
                        Uses Stripe Connect — your money goes directly to your account. RecMail never holds funds.
                      </p>
                    </div>
                  )}
                </div>

                <div className={sectionCls}>
                  <h2 className="text-sm font-bold text-gray-900">Google Reviews</h2>
                  <div>
                    <label className={labelCls}>Your Google review link</label>
                    <input value={reviewUrl} onChange={e => setReviewUrl(e.target.value)}
                      placeholder="https://g.page/r/your-review-link/review"
                      className={inputCls} />
                    <p className="text-[10px] text-gray-400 mt-1">Used in the Review Request automation.</p>
                  </div>
                </div>
              </>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <div className={sectionCls}>
                <h2 className="text-sm font-bold text-gray-900">Plan & Billing</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'starter', name: 'Starter', price: '$49/mo', features: ['1 phone number', 'Up to 200 leads/mo', 'Gemini Flash AI', 'Email digest'] },
                    { id: 'growth', name: 'Growth', price: '$99/mo', features: ['1 phone number', 'Unlimited leads', 'Gemini Pro AI', 'All automations', 'Slack alerts'] },
                    { id: 'pro', name: 'Pro', price: '$199/mo', features: ['3 phone numbers', 'Unlimited leads', 'Gemini Pro AI', 'Priority support', 'White-label option'] },
                  ].map(plan => (
                    <div key={plan.id} className={cn('rounded-2xl border p-4 transition-all',
                      plan.id === 'growth' ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200'
                    )}>
                      {plan.id === 'growth' && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full mb-2 inline-block">Current plan</span>}
                      <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5">{plan.price}</p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                      {plan.id !== 'growth' && (
                        <button className="mt-3 w-full text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-xl transition-colors">
                          {plan.id === 'starter' ? 'Downgrade' : 'Upgrade'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-700">Next billing date</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">June 1, 2026</p>
                  <p className="text-xs text-gray-400 mt-1">Your card ending in 4242 will be charged $99.00</p>
                </div>
              </div>
            )}

            {/* Referrals */}
            {activeTab === 'referrals' && (
              <>
                <RoiWidget conversationsStarted={47} qualifiedLeads={12} avgJobValue={350} />

                <div className={sectionCls}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Share2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Your referral link</p>
                      <p className="text-xs text-gray-400">Earn 10% MRR for every business you refer — forever</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-sm text-gray-700 truncate">
                      {`https://recmail.io/signup?ref=${MOCK_REFERRAL_CODE}`}
                    </div>
                    <button onClick={copyReferralLink}
                      className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        copied ? 'bg-emerald-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
                      )}>
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-semibold text-purple-800">Code: <span className="font-mono">{MOCK_REFERRAL_CODE}</span></p>
                    <p className="text-[11px] text-purple-600 mt-0.5">Anyone who signs up with your link is linked permanently.</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: <Users className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50', label: 'Active referrals', value: 2, sub: '3 total' },
                    { icon: <DollarSign className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Monthly commission', value: '$19.80', sub: 'paid on the 1st' },
                    { icon: <TrendingUp className="w-4 h-4 text-amber-600" />, bg: 'bg-amber-50', label: 'Annual projection', value: '$238', sub: 'at current rate' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', stat.bg)}>{stat.icon}</div>
                      <p className="text-xl font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">{stat.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div className={sectionCls}>
                  <p className="text-sm font-bold text-gray-900">Your referrals</p>
                  <div className="-mx-6 divide-y divide-gray-50">
                    {MOCK_REFERRALS.map(ref => (
                      <div key={ref.name} className="px-6 py-3.5 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                          {ref.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{ref.name}</p>
                          <p className="text-xs text-gray-400">Joined {ref.since}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {ref.status === 'active' ? (
                            <>
                              <p className="text-sm font-bold text-emerald-600">+${ref.commission.toFixed(2)}/mo</p>
                              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Active</span>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-400">Pending</p>
                              <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Trial</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={sectionCls}>
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-purple-500" />
                    <p className="text-sm font-bold text-gray-900">How it works</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {[
                      { step: '1', title: 'Share your link', desc: 'Send it to any contractor, HVAC company, plumber, or roofer.' },
                      { step: '2', title: 'They sign up', desc: 'When they start a paid plan, your account is credited.' },
                      { step: '3', title: 'Earn forever', desc: '10% of their monthly bill, every month, for life.' },
                    ].map(item => (
                      <div key={item.step} className="text-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center mx-auto mb-2">{item.step}</div>
                        <p className="text-xs font-bold text-gray-800">{item.title}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
