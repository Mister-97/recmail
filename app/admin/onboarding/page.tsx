import { serviceSupabase } from '@/lib/supabase/service'
import Link from 'next/link'
import { CheckCircle2, XCircle, ArrowRight, AlertCircle } from 'lucide-react'

export const revalidate = 0

const STEPS = [
  { key: 'twilio_number', label: 'Twilio number provisioned', check: (c: any) => !!c.twilio_number },
  { key: 'prompt', label: 'AI prompt customized', check: (c: any) => !!c.gemini_prompt_override },
  { key: 'stripe', label: 'Stripe Connect linked', check: (c: any) => !!c.stripe_account_id },
  { key: 'slack', label: 'Slack webhook set', check: (c: any) => !!c.slack_webhook_url },
  { key: 'active', label: 'Account set to active', check: (c: any) => c.plan_status === 'active' },
]

export default async function OnboardingPage() {
  const { data: clients } = await serviceSupabase
    .from('clients')
    .select('id, business_name, twilio_number, gemini_prompt_override, stripe_account_id, slack_webhook_url, plan_status, plan, created_at')
    .neq('plan_status', 'churned')
    .order('created_at', { ascending: false })

  const withScores = (clients ?? []).map(c => ({
    ...c,
    steps: STEPS.map(s => ({ ...s, done: s.check(c) })),
    score: STEPS.filter(s => s.check(c)).length,
  }))

  // Sort: incomplete first, then by score ascending (most work needed first)
  const sorted = withScores.sort((a, b) => {
    if (a.score === STEPS.length && b.score < STEPS.length) return 1
    if (b.score === STEPS.length && a.score < STEPS.length) return -1
    return a.score - b.score
  })

  const incomplete = sorted.filter(c => c.score < STEPS.length)
  const complete = sorted.filter(c => c.score === STEPS.length)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Tracker</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {incomplete.length} client{incomplete.length !== 1 ? 's' : ''} need setup · {complete.length} fully onboarded
        </p>
      </div>

      {incomplete.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">Needs Attention ({incomplete.length})</h2>
          </div>
          <div className="space-y-3">
            {incomplete.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-xs font-black text-amber-600">
                      {c.business_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c.business_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${planColors[c.plan ?? 'starter']}`}>
                          {c.plan ?? 'starter'}
                        </span>
                        <span className="text-[10px] text-gray-400">Joined {fmtDate(c.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-700">{c.score}/{STEPS.length} steps</p>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(c.score / STEPS.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Link href={`/admin/clients/${c.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                      Setup <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {c.steps.map(step => (
                    <div key={step.key} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-medium ${
                      step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {step.done
                        ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        : <XCircle className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {complete.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-800">Fully Onboarded ({complete.length})</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {complete.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600">
                    {c.business_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.business_name}</p>
                    <p className="text-[10px] text-gray-400">Joined {fmtDate(c.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    All {STEPS.length} steps done
                  </span>
                  <Link href={`/admin/clients/${c.id}`}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(clients ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-400">No clients yet.</div>
      )}
    </div>
  )
}
