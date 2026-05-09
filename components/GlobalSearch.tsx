'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, MessageSquare, Users, Zap, BarChart2, Kanban, Megaphone, ArrowRight } from 'lucide-react'

type Result = {
  id: string
  type: 'conversation' | 'page'
  title: string
  subtitle?: string
  href: string
  icon: React.ReactNode
}

const PAGES: Result[] = [
  { id: 'p-inbox', type: 'page', title: 'Inbox', subtitle: 'All conversations', href: '/dashboard', icon: <MessageSquare className="w-4 h-4 text-blue-500" /> },
  { id: 'p-pipeline', type: 'page', title: 'Pipeline', subtitle: 'Kanban board', href: '/dashboard/pipeline', icon: <Kanban className="w-4 h-4 text-violet-500" /> },
  { id: 'p-analytics', type: 'page', title: 'Analytics', subtitle: 'Stats and trends', href: '/dashboard/analytics', icon: <BarChart2 className="w-4 h-4 text-indigo-500" /> },
  { id: 'p-automations', type: 'page', title: 'Automations', subtitle: 'Configure auto-responses', href: '/dashboard/automations', icon: <Zap className="w-4 h-4 text-amber-500" /> },
  { id: 'p-campaigns', type: 'page', title: 'Campaigns', subtitle: 'Broadcast messages', href: '/dashboard/campaigns', icon: <Megaphone className="w-4 h-4 text-pink-500" /> },
  { id: 'p-customers', type: 'page', title: 'Customers', subtitle: 'Customer profiles', href: '/dashboard/customers', icon: <Users className="w-4 h-4 text-emerald-500" /> },
  { id: 'p-settings', type: 'page', title: 'Settings', subtitle: 'Business & integrations', href: '/dashboard/settings', icon: <Search className="w-4 h-4 text-gray-400" /> },
]

type Props = {
  conversations?: Array<{ id: string; customer_name: string | null; customer_phone: string; last_message?: string }>
}

export default function GlobalSearch({ conversations = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return p
  }

  const convResults: Result[] = conversations
    .filter(c => {
      if (!query) return false
      const q = query.toLowerCase()
      return (c.customer_name || '').toLowerCase().includes(q) ||
        c.customer_phone.includes(q) ||
        (c.last_message || '').toLowerCase().includes(q)
    })
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      type: 'conversation' as const,
      title: c.customer_name || formatPhone(c.customer_phone),
      subtitle: c.last_message?.slice(0, 60),
      href: `/dashboard/${c.id}`,
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
    }))

  const pageResults = PAGES.filter(p =>
    !query || p.title.toLowerCase().includes(query.toLowerCase()) || (p.subtitle || '').toLowerCase().includes(query.toLowerCase())
  )

  const results = [...convResults, ...pageResults]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (!open) return
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && results[focused]) {
        router.push(results[focused].href)
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, results, focused, router])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setFocused(0) }
  }, [open])

  useEffect(() => { setFocused(0) }, [query])

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 hover:border-gray-300 shadow-sm"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="text-[9px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { setOpen(false); setQuery('') }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations, pages, customers…"
            className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400"
          />
          <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">No results</div>
          )}

          {convResults.length > 0 && (
            <div className="px-3 pb-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 py-1.5">Conversations</p>
              {convResults.map((r, i) => (
                <button key={r.id}
                  onClick={() => { router.push(r.href); setOpen(false); setQuery('') }}
                  onMouseEnter={() => setFocused(i)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                    focused === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>}
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 flex-shrink-0 transition-opacity', focused === i ? 'text-blue-400 opacity-100' : 'opacity-0')} />
                </button>
              ))}
            </div>
          )}

          <div className="px-3">
            {convResults.length > 0 && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 py-1.5 mt-1">Pages</p>}
            {pageResults.map((r, i) => {
              const globalIdx = convResults.length + i
              return (
                <button key={r.id}
                  onClick={() => { router.push(r.href); setOpen(false); setQuery('') }}
                  onMouseEnter={() => setFocused(globalIdx)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                    focused === globalIdx ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400">{r.subtitle}</p>}
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 flex-shrink-0 transition-opacity', focused === globalIdx ? 'text-blue-400 opacity-100' : 'opacity-0')} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-50 flex items-center gap-4">
          {[['↑↓', 'navigate'], ['↵', 'open'], ['ESC', 'close']].map(([key, hint]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">{key}</kbd>
              <span className="text-[10px] text-gray-400">{hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
