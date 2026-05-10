'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Mail, Building2, Phone, Brain, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { INDUSTRIES, getIndustry, type Industry } from '@/lib/ai-prompts'

type Step = 'welcome' | 'industry' | 'business' | 'twilio' | 'ai' | 'test' | 'done'

const STEPS: Step[] = ['welcome', 'industry', 'business', 'twilio', 'ai', 'test', 'done']

const STEP_LABELS: Record<Step, string> = {
  welcome: 'Welcome',
  industry: 'Industry',
  business: 'Business Info',
  twilio: 'Phone Setup',
  ai: 'AI Config',
  test: 'Test It',
  done: 'Done',
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [industry, setIndustry] = useState<Industry>('hvac')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [promptOverride, setPromptOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const router = useRouter()

  const stepIdx = STEPS.indexOf(step)
  const progress = (stepIdx / (STEPS.length - 1)) * 100

  const industryConfig = getIndustry(industry)

  function selectIndustry(id: Industry) {
    setIndustry(id)
    // Pre-populate the AI prompt with the industry's system prompt
    setPromptOverride(getIndustry(id).systemPrompt)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, phone, ownerPhone, twilioSid, twilioToken, promptOverride, industry }),
      })
      setStep('test')
    } finally { setSaving(false) }
  }

  async function sendTest() {
    setTestSent(true)
    await fetch('/api/onboarding/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: ownerPhone }),
    })
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
  const labelCls = "text-xs font-semibold text-gray-600 block mb-1.5"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
            <Mail className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">RecMail</span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.filter(s => s !== 'welcome' && s !== 'done').map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  STEPS.indexOf(s) < stepIdx ? 'bg-blue-500 text-white' : STEPS.indexOf(s) === stepIdx ? 'bg-white text-blue-600' : 'bg-white/20 text-white/50'
                )}>
                  {STEPS.indexOf(s) < stepIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-[11px] font-medium transition-all hidden sm:block',
                  STEPS.indexOf(s) === stepIdx ? 'text-white' : 'text-white/40'
                )}>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Welcome */}
          {step === 'welcome' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome to RecMail</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Set up takes about 3 minutes. When you're done, every missed call will automatically start a text conversation — and your AI receptionist will handle the rest.
              </p>
              <div className="space-y-2.5 text-left mb-8">
                {[
                  { icon: <Phone className="w-4 h-4 text-blue-500" />, text: 'Connect your phone number via Twilio' },
                  { icon: <Brain className="w-4 h-4 text-violet-500" />, text: 'Configure your AI receptionist' },
                  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: 'Send a test SMS to make sure it works' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    {item.icon}
                    <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep('industry')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/30 text-sm">
                Let's get started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Industry selection */}
          {step === 'industry' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-gray-900 mb-1">What type of business are you?</h2>
                <p className="text-xs text-gray-400">We'll tailor your AI receptionist and example conversations to match your industry.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind.id}
                    onClick={() => selectIndustry(ind.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center',
                      industry === ind.id
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    )}
                  >
                    <span className="text-2xl">{ind.emoji}</span>
                    <span className={cn('text-[11px] font-bold leading-tight', industry === ind.id ? 'text-blue-700' : 'text-gray-700')}>{ind.label}</span>
                  </button>
                ))}
              </div>

              {/* Preview of selected industry */}
              {industryConfig && (
                <div className={cn('rounded-2xl px-4 py-3 mb-5 border', industryConfig.bgColor, 'border-opacity-50')}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">First SMS your customers will receive:</p>
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{industryConfig.firstMessage.replace('[Business Name]', 'Your Business')}"</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('welcome')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('business')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Business info */}
          {step === 'business' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Business Info</h2>
                  <p className="text-xs text-gray-400">This is how your AI introduces itself</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Business name *</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={industryConfig ? `${industryConfig.emoji} e.g. "${industryConfig.label === 'Cleaning' ? 'Sparkle Clean Co.' : industryConfig.label === 'HVAC' ? 'ProAir HVAC' : `Pro ${industryConfig.label}`}"` : 'My Business'}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Your cell number (for morning brief texts)</label>
                  <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="+1 (817) 555-0000" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('industry')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('twilio')} disabled={!businessName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Twilio */}
          {step === 'twilio' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Phone Setup</h2>
                  <p className="text-xs text-gray-400">Connect your Twilio number</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4">
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  In your Twilio console, go to your phone number settings and set the Voice webhook to:<br />
                  <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded mt-1 inline-block text-[11px]">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.vercel.app'}/api/webhooks/twilio/voice
                  </code>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Your Twilio phone number *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (817) 555-0001" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Twilio Account SID *</label>
                  <input value={twilioSid} onChange={e => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Twilio Auth Token *</label>
                  <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)}
                    placeholder="Your auth token" className={inputCls} />
                  <p className="text-[10px] text-gray-400 mt-1">Stored encrypted — never exposed to the browser.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('business')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('ai')} disabled={!phone.trim() || !twilioSid.trim() || !twilioToken.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* AI config */}
          {step === 'ai' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Receptionist</h2>
                  <p className="text-xs text-gray-400">Pre-loaded for {industryConfig.label} {industryConfig.emoji} — customize as needed</p>
                </div>
              </div>

              {/* Sample questions hint */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
                <p className="text-[11px] font-semibold text-amber-700 mb-1.5">Your AI will ask things like:</p>
                <ul className="space-y-1">
                  {industryConfig.sampleQuestions.slice(0, 3).map((q, i) => (
                    <li key={i} className="text-[11px] text-amber-600 flex items-start gap-1.5">
                      <span className="mt-0.5 opacity-60">•</span>{q}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className={labelCls}>AI instructions</label>
                <textarea value={promptOverride} onChange={e => setPromptOverride(e.target.value)} rows={5}
                  className={cn(inputCls, 'resize-none text-xs leading-relaxed')} />
                <p className="text-[10px] text-gray-400 mt-1">Pre-loaded with {industryConfig.label} defaults. Edit or leave as-is — you can always adjust in Settings.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('twilio')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  {saving ? 'Saving…' : <><span>Save & Continue</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Test */}
          {step === 'test' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Test Your Setup</h2>
                  <p className="text-xs text-gray-400">Make sure everything is working</p>
                </div>
              </div>

              {/* Mini mock convo preview */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Preview — {industryConfig.label} {industryConfig.emoji}</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {industryConfig.mockConvo.slice(0, 4).map((msg, i) => (
                    <div key={i} className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[80%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed',
                        msg.direction === 'outbound'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                      )}>
                        {msg.body}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
                <p className="text-sm font-semibold text-gray-800">How to test:</p>
                {[
                  '1. Call your Twilio number from any phone and hang up',
                  '2. You should receive a text within 5 seconds',
                  '3. Reply to the text — the AI will respond',
                ].map(s => (
                  <p key={s} className="text-xs text-gray-600">{s}</p>
                ))}
              </div>
              {ownerPhone && (
                <div className="mb-4">
                  {testSent ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold py-3 px-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Test SMS sent to {ownerPhone}!
                    </div>
                  ) : (
                    <button onClick={sendTest}
                      className="w-full flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 font-bold py-3 rounded-2xl hover:bg-blue-50 transition-colors text-sm">
                      <Phone className="w-4 h-4" /> Send test SMS to {ownerPhone}
                    </button>
                  )}
                </div>
              )}
              <button onClick={() => setStep('done')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 text-sm">
                I'm ready — Go to dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">{industryConfig.emoji}</div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">
                RecMail is live for your {industryConfig.label.toLowerCase()} business. The next time someone calls and gets no answer, your AI will follow up automatically.
              </p>
              {industryConfig.campaignTips[0] && (
                <div className={cn('rounded-xl px-4 py-3 mb-6 text-left', industryConfig.bgColor)}>
                  <p className="text-[11px] font-semibold text-gray-600 mb-0.5">Pro tip for {industryConfig.label}</p>
                  <p className="text-xs text-gray-600">{industryConfig.campaignTips[0]}</p>
                </div>
              )}
              <button onClick={async () => {
                await fetch('/api/onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ businessName, industry, ownerPhone, promptOverride }),
                })
                router.push('/dashboard')
              }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/30 text-sm">
                Open your dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-white/30 text-xs mt-6">RecMail · Built for service businesses</p>
      </div>
    </div>
  )
}
