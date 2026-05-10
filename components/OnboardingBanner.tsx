'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, Phone, Brain, PhoneForwarded } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingBannerProps {
  hasNumber: boolean
  hasStripe: boolean
  hasPrompt: boolean
}

export default function OnboardingBanner({ hasNumber, hasPrompt }: OnboardingBannerProps) {
  const router = useRouter()

  const steps = [
    {
      id: 'number',
      icon: Phone,
      title: 'Number assigned',
      pendingTitle: 'Awaiting your number',
      action: 'View settings',
      href: '/dashboard/settings',
      done: hasNumber,
    },
    {
      id: 'prompt',
      icon: Brain,
      title: 'AI configured',
      pendingTitle: 'Train your AI',
      action: 'Customize',
      href: '/dashboard/settings?tab=ai',
      done: hasPrompt,
    },
    {
      id: 'forwarding',
      icon: PhoneForwarded,
      title: 'Call forwarding set',
      pendingTitle: 'Set up call forwarding',
      action: 'How to',
      href: '/dashboard/settings?tab=business#forwarding',
      done: hasNumber, // once number is assigned, they can set forwarding
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  if (allDone) return null

  return (
    <div className="flex-shrink-0 bg-indigo-950 border-b border-indigo-900 px-6 py-0">
      <div className="flex items-center gap-6 h-12">
        {/* Label */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex gap-1">
            {steps.map(s => (
              <div key={s.id} className={cn('w-1.5 h-1.5 rounded-full', s.done ? 'bg-blue-400' : 'bg-indigo-700')} />
            ))}
          </div>
          <p className="text-xs font-semibold text-indigo-200 whitespace-nowrap">
            Finish setup — {completedCount} of {steps.length} done
          </p>
        </div>

        <div className="w-px h-5 bg-indigo-800 flex-shrink-0" />

        {/* Steps inline */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isNext = !step.done && steps.slice(0, i).every(s => s.done)
            return (
              <div key={step.id} className="flex items-center gap-1.5">
                {i > 0 && <div className="w-3 h-px bg-indigo-800 flex-shrink-0" />}
                <button
                  onClick={() => !step.done && router.push(step.href)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                    step.done
                      ? 'text-indigo-600 cursor-default'
                      : isNext
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-800'
                  )}
                >
                  {step.done
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    : <Icon className="w-3 h-3 flex-shrink-0" />
                  }
                  {step.done ? step.title : step.pendingTitle}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
