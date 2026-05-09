'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/types/database'
import { formatDistanceToNow, isToday, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Star, Search, X, Archive, CheckSquare } from 'lucide-react'

type ConversationWithPreview = Conversation & {
  last_message?: string
}

type Props = {
  initialConversations: ConversationWithPreview[]
  clientId: string
  activeTab?: string
}

export default function ConversationList({ initialConversations, clientId, activeTab = 'open' }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [starred, setStarred] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    if (clientId === 'mock-client') return
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `client_id=eq.${clientId}` }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clientId, router, supabase])

  const filtered = conversations.filter(c => {
    if (c.status !== activeTab) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (c.customer_name || '').toLowerCase().includes(q) ||
      c.customer_phone.includes(q) ||
      (c.last_message || '').toLowerCase().includes(q)
    )
  })

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'j') {
        e.preventDefault()
        setFocusedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'k') {
        e.preventDefault()
        setFocusedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        router.push(`/dashboard/${filtered[focusedIndex].id}`)
      } else if (e.key === 'e' && focusedIndex >= 0) {
        e.preventDefault()
        const id = filtered[focusedIndex].id
        fetch(`/api/conversations/${id}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'closed' }),
        }).then(() => router.refresh())
      } else if (e.key === '/') {
        e.preventDefault()
        document.getElementById('conv-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [filtered, focusedIndex, router])

  async function bulkAction(status: string) {
    await Promise.all([...selected].map(id =>
      fetch(`/api/conversations/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    setSelected(new Set())
    router.refresh()
  }

  async function exportCsv() {
    const res = await fetch('/api/conversations/export')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'h:mm a')
    return formatDistanceToNow(date, { addSuffix: false })
  }

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '')
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return phone
  }

  const tabs = [
    { id: 'open', label: 'Open' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'closed', label: 'Closed' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-gray-900">Conversations</h2>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} title="Export CSV" className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
              CSV ↓
            </button>
            <span className="text-xs text-gray-400">{conversations.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
          <input
            id="conv-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full text-xs bg-gray-50 border border-gray-100 rounded-xl pl-7 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-200 focus:bg-white transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Pill tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const count = conversations.filter(c => c.status === tab.id).length
            return (
              <button key={tab.id}
                onClick={() => router.push(tab.id === 'open' ? '/dashboard' : `/dashboard?status=${tab.id}`)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}>
                {tab.label}
                {count > 0 && (
                  <span className={cn('text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none',
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  )}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-semibold text-blue-700">{selected.size} selected</span>
          <button onClick={() => bulkAction('closed')} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
          <button onClick={() => bulkAction('qualified')} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800">
            <CheckSquare className="w-3.5 h-3.5" /> Qualify
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{search ? 'No results found' : 'No conversations here'}</p>
            {search && <button onClick={() => setSearch('')} className="text-xs text-blue-500 mt-1 hover:underline">Clear search</button>}
          </div>
        ) : (
          filtered.map((conv, idx) => {
            const isSelected = pathname === `/dashboard/${conv.id}`
            const isBulkSelected = selected.has(conv.id)
            const isKeyFocused = focusedIndex === idx
            const isUnread = conv.status === 'open' && conv.turn_count < 2
            const isStarred = starred.has(conv.id)
            const displayName = conv.customer_name || formatPhone(conv.customer_phone)
            const hasName = !!conv.customer_name
            const initial = displayName[0].toUpperCase()
            const preview = conv.last_message || ''
            const previewParts = preview.split(' - ')
            const subject = previewParts[0]
            const snippet = previewParts.slice(1).join(' - ')
            const avatarColors = ['from-blue-500 to-blue-600','from-violet-500 to-purple-600','from-emerald-500 to-teal-600','from-orange-500 to-red-500','from-pink-500 to-rose-600']
            const colorIdx = displayName.charCodeAt(0) % avatarColors.length

            return (
              <div key={conv.id}
                onClick={() => router.push(`/dashboard/${conv.id}`)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer group relative transition-all duration-150',
                  isSelected ? 'bg-blue-50 border-l-[3px] border-l-blue-500 pl-[13px]'
                  : isBulkSelected ? 'bg-blue-50/50'
                  : isKeyFocused ? 'bg-gray-50 border-l-[3px] border-l-gray-300 pl-[13px]'
                  : isUnread ? 'bg-white hover:bg-gray-50'
                  : 'bg-white hover:bg-gray-50 opacity-80 hover:opacity-100',
                )}>

                {/* Avatar + checkbox overlay */}
                <div className="relative flex-shrink-0 w-9 h-9"
                  onClick={e => {
                    e.stopPropagation()
                    setSelected(s => { const n = new Set(s); n.has(conv.id) ? n.delete(conv.id) : n.add(conv.id); return n })
                  }}>
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shadow-sm transition-opacity',
                    isSelected || isUnread ? `bg-gradient-to-br ${avatarColors[colorIdx]}` : 'bg-gray-200 text-gray-500',
                    isBulkSelected ? 'opacity-0' : 'group-hover:opacity-0'
                  )}>
                    {initial}
                  </div>
                  <div className={cn('absolute inset-0 rounded-full flex items-center justify-center transition-opacity',
                    isBulkSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center',
                      isBulkSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-white'
                    )}>
                      {isBulkSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn('text-[13px] truncate', isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-600')}>
                      {displayName}
                      {!hasName && <span className="ml-1.5 text-[10px] font-normal text-gray-300 align-middle bg-gray-100 px-1.5 py-0.5 rounded-full">unknown</span>}
                    </span>
                    <span className={cn('text-[11px] flex-shrink-0', isUnread ? 'font-semibold text-gray-900' : 'text-gray-400')}>
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                    <span className="text-xs truncate flex-1 min-w-0 block">
                      {subject
                        ? <><span className={cn('text-gray-600', isUnread && 'font-medium text-gray-800')}>{subject}</span>{snippet && <span className="text-gray-400"> · {snippet}</span>}</>
                        : <span className="text-gray-300 italic">No messages yet</span>}
                    </span>
                    <div className="ml-auto flex-shrink-0"
                      onClick={e => { e.stopPropagation(); setStarred(s => { const n = new Set(s); n.has(conv.id) ? n.delete(conv.id) : n.add(conv.id); return n }) }}>
                      <Star className={cn('w-3.5 h-3.5 transition-colors', isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-300 opacity-0 group-hover:opacity-100')} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Keyboard hints */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 flex-shrink-0">
        {[['J/K', 'navigate'], ['E', 'archive'], ['/', 'search']].map(([key, hint]) => (
          <div key={key} className="flex items-center gap-1">
            <kbd className="text-[9px] font-mono font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">{key}</kbd>
            <span className="text-[10px] text-gray-400">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
