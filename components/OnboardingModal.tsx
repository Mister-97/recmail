'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, Phone, Brain, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react'
import { INDUSTRIES, getIndustry, type Industry } from '@/lib/ai-prompts'

type Step = 'welcome' | 'industry' | 'business' | 'phone' | 'ai' | 'done'
const STEPS: Step[] = ['welcome', 'industry', 'business', 'phone', 'ai', 'done']
const STEP_LABELS: Record<Step, string> = {
  welcome: 'Welcome',
  industry: 'Industry',
  business: 'Business Info',
  phone: 'Phone Setup',
  ai: 'AI Config',
  done: 'Done',
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  return phone
}

export default function OnboardingModal({
  twilioNumber,
  initialBusinessName = '',
  initialPrompt = '',
}: {
  twilioNumber: string | null
  initialBusinessName?: string
  initialPrompt?: string
}) {
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState<Step>('welcome')
  const [industry, setIndustry] = useState<Industry>('hvac')
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [ownerPhone, setOwnerPhone] = useState('')
  const [promptOverride, setPromptOverride] = useState(initialPrompt)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const stepIdx = STEPS.indexOf(step)
  const visibleSteps = STEPS.filter(s => s !== 'welcome' && s !== 'done')
  const progress = (stepIdx / (STEPS.length - 1)) * 100
  const industryConfig = getIndustry(industry)

  function selectIndustry(id: Industry) {
    setIndustry(id)
    if (!initialPrompt) setPromptOverride(getIndustry(id).systemPrompt)
  }

  async function save(opts?: { skipToEnd?: boolean }) {
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, industry, ownerPhone, promptOverride }),
      })
      if (opts?.skipToEnd) {
        setOpen(false)
        router.refresh()
      } else {
        setStep('done')
      }
    } finally {
      setSaving(false)
    }
  }

  async function skipAll() {
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, industry, ownerPhone, promptOverride }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all'
  const labelCls = 'text-xs font-semibold text-gray-600 block mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg relative">

        {/* Progress bar (above card) */}
        {step !== 'welcome' && step !== 'done' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              {visibleSteps.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-6 h-px bg-white/20" />}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    STEPS.indexOf(s) < stepIdx ? 'bg-blue-500 text-white' :
                    STEPS.indexOf(s) === stepIdx ? 'bg-white text-blue-600' :
                    'bg-white/20 text-white/50'
                  )}>
                    {STEPS.indexOf(s) < stepIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-[11px] font-medium transition-all hidden sm:block',
                    STEPS.indexOf(s) === stepIdx ? 'text-white' : 'text-white/40'
                  )}>{STEP_LABELS[s]}</span>
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Welcome */}
          {step === 'welcome' && (
            <div className="p-8 text-center">
              <button onClick={skipAll} className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome to RecMail</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Set up takes about 2 minutes. Every missed call automatically starts a text conversation. Your AI receptionist handles the rest.
              </p>
              <div className="space-y-2.5 text-left mb-8">
                {[
                  { icon: <Building2 className="w-4 h-4 text-blue-500" />, text: 'Tell us about your business' },
                  { icon: <Phone className="w-4 h-4 text-violet-500" />, text: 'Get your dedicated RecMail number' },
                  { icon: <Brain className="w-4 h-4 text-amber-500" />, text: 'Customize your AI receptionist' },
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
              <button onClick={skipAll} className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Skip setup for now
              </button>
            </div>
          )}

          {/* Industry */}
          {step === 'industry' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-gray-900 mb-1">What type of business are you?</h2>
                <p className="text-xs text-gray-400">We'll tailor your AI receptionist to match your industry.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5 max-h-64 overflow-y-auto pr-1">
                {INDUSTRIES.map(ind => (
                  <button key={ind.id} onClick={() => selectIndustry(ind.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center',
                      industry === ind.id
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    )}>
                    <span className="text-2xl">{ind.emoji}</span>
                    <span className={cn('text-[11px] font-bold leading-tight', industry === ind.id ? 'text-blue-700' : 'text-gray-700')}>{ind.label}</span>
                  </button>
                ))}
              </div>
              {industryConfig && (
                <div className={cn('rounded-2xl px-4 py-3 mb-5 border', industryConfig.bgColor)}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">First SMS your customers will receive:</p>
                  <p className="text-xs text-gray-600 italic">"{industryConfig.firstMessage.replace('[Business Name]', 'Your Business')}"</p>
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
              <div className="text-center mt-3">
                <button onClick={skipAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
              </div>
            </div>
          )}

          {/* Business Info */}
          {step === 'business' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Business Info</h2>
                  <p className="text-xs text-gray-400">How your AI introduces itself to customers</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Business name *</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={industryConfig ? `e.g. "Pro ${industryConfig.label} Services"` : 'My Business'}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Your cell number <span className="text-gray-400 font-normal">(optional, for morning lead digests)</span></label>
                  <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="+1 (817) 555-0000" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('industry')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('phone')} disabled={!businessName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-3">
                <button onClick={skipAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
              </div>
            </div>
          )}

          {/* Phone Setup */}
          {step === 'phone' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your RecMail Number</h2>
                  <p className="text-xs text-gray-400">Dedicated line for missed call recovery</p>
                </div>
              </div>

              {twilioNumber ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-4 flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-0.5">Your number is ready</p>
                    <p className="text-xl font-bold text-emerald-900 tabular-nums">{formatPhone(twilioNumber)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4 mb-4">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Number pending assignment</p>
                  <p className="text-xs text-amber-600 leading-relaxed">Our team will assign your dedicated RecMail number shortly after setup. You'll see it here once it's live.</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-2">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">How it works</p>
                <div className="space-y-1.5">
                  {[
                    'We provision a dedicated number on your behalf. No extra accounts needed.',
                    'Set your business phone to forward unanswered calls to your RecMail number',
                    'When a call goes unanswered, the AI automatically follows up via SMS',
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold text-[11px] mt-0.5">{i + 1}.</span>
                      <span className="text-xs text-blue-700 leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('business')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep('ai')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-3">
                <button onClick={skipAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
              </div>
            </div>
          )}

          {/* AI Config */}
          {step === 'ai' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Receptionist</h2>
                  <p className="text-xs text-gray-400">Pre-loaded for {industryConfig.label} {industryConfig.emoji}. Customize as needed.</p>
                </div>
              </div>
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
                <p className="text-[10px] text-gray-400 mt-1">Editable any time in Settings → AI.</p>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep('phone')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => save()} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                  {saving ? 'Saving…' : <><span>Save & Finish</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
              <div className="text-center mt-3">
                <button onClick={skipAll} disabled={saving} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">{industryConfig.emoji}</div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">You're set up!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                RecMail is ready for your {industryConfig.label.toLowerCase()} business.
                {!twilioNumber && ' Your dedicated number will be assigned shortly. You\'ll see it in the banner above your inbox.'}
              </p>
              {industryConfig.campaignTips[0] && (
                <div className={cn('rounded-xl px-4 py-3 mb-6 text-left', industryConfig.bgColor)}>
                  <p className="text-[11px] font-semibold text-gray-600 mb-0.5">Pro tip for {industryConfig.label}</p>
                  <p className="text-xs text-gray-600">{industryConfig.campaignTips[0]}</p>
                </div>
              )}
              <button onClick={() => { setOpen(false); router.refresh() }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/30 text-sm">
                Open my dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
