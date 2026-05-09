'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Message, Conversation } from '@/types/database'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, ChevronDown, Archive, Trash2, MoreHorizontal, ArrowLeft, Zap, X, Tag, Lock, UserCircle } from 'lucide-react'
import Link from 'next/link'

type Props = {
  conversation: Conversation
  initialMessages: Message[]
}

const GLOBAL_TEMPLATES = [
  { id: 't1', title: 'On our way', body: 'Great news — our technician is on the way and should arrive within 30–60 minutes!' },
  { id: 't2', title: 'Call back soon', body: 'Thanks for reaching out! One of our team members will give you a call back within the hour.' },
  { id: 't3', title: 'Schedule tomorrow', body: "We'd love to help! Can we schedule you for tomorrow morning between 8–10am?" },
  { id: 't4', title: 'Need more info', body: 'Thanks for contacting us! Could you share a bit more about the issue so we can send the right technician?' },
  { id: 't5', title: 'Request address', body: 'Perfect! Could you share your address so we can get someone out to you?' },
  { id: 't6', title: 'Appointment confirmed', body: 'Your appointment is confirmed! Our tech will be there at the time we discussed. See you soon!' },
]

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

const SOURCE_OPTIONS = [
  { value: 'google', label: 'Google', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'yelp', label: 'Yelp', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'facebook', label: 'Facebook', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'referral', label: 'Referral', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'nextdoor', label: 'Nextdoor', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-600 border-gray-200' },
]

const STAFF_OPTIONS = ['Unassigned', 'Mike R.', 'Sarah L.', 'James T.', 'Admin']

export default function MessageThread({ conversation, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [aiTyping, setAiTyping] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [noteMode, setNoteMode] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [internalNotes, setInternalNotes] = useState<{ id: string; text: string; author: string; time: string }[]>([])
  const [leadSource, setLeadSource] = useState<string | null>(null)
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const [assignedTo, setAssignedTo] = useState('Unassigned')
  const [showAssign, setShowAssign] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (conversation.id.startsWith('mock')) return
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => [...prev, msg])
          // Show typing indicator after inbound message until AI replies
          if (msg.direction === 'inbound') {
            setAiTyping(true)
            setTimeout(() => setAiTyping(false), 8000) // max 8s fallback
          } else if (msg.direction === 'outbound') {
            setAiTyping(false)
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, supabase])

  const isMock = conversation.id.startsWith('mock')

  async function handleSend() {
    if (!replyText.trim() || sending) return
    setSending(true)
    try {
      if (isMock) {
        // Demo mode: add message locally
        const fakeMsg: Message = {
          id: `local-${Date.now()}`,
          conversation_id: conversation.id,
          direction: 'outbound',
          body: replyText.trim(),
          twilio_sid: null,
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, fakeMsg])
        setReplyText('')
        setReplyOpen(false)
        return
      }
      const res = await fetch(`/api/conversations/${conversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      if (res.ok) { setReplyText(''); setReplyOpen(false) }
    } finally { setSending(false) }
  }

  async function updateStatus(status: string) {
    if (isMock) {
      // Demo mode: just refresh to show the effect
      router.push('/dashboard')
      return
    }
    await fetch(`/api/conversations/${conversation.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  function saveNote() {
    if (!noteText.trim()) return
    setInternalNotes(prev => [...prev, {
      id: `n${Date.now()}`,
      text: noteText.trim(),
      author: 'You',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }])
    setNoteText('')
    setNoteMode(false)
  }

  function useTemplate(body: string) {
    setReplyText(body)
    setShowTemplates(false)
    setReplyOpen(true)
  }

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '')
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return phone
  }

  const displayName = conversation.customer_name || formatPhone(conversation.customer_phone)

  return (
    <div className="flex flex-col h-full bg-white min-h-0 flex-1">
      {/* Thread toolbar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 flex-shrink-0 bg-white">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Archive" onClick={() => updateStatus('closed')}>
          <Archive className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="relative group">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-20 min-w-44">
            <button onClick={() => navigator.clipboard?.writeText(conversation.customer_phone)} className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">Copy phone number</button>
            <button onClick={() => updateStatus('open')} className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">Reopen</button>
            <button onClick={async () => { await navigator.clipboard?.writeText(`${window.location.origin}/dashboard/${conversation.id}`) }} className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">Copy link</button>
            <div className="border-t border-gray-50 my-1" />
            <button onClick={() => updateStatus('closed')} className="w-full text-left px-3.5 py-2 text-sm text-red-500 hover:bg-red-50">Delete</button>
          </div>
        </div>
        <div className="flex-1" />
        <Badge className={cn('text-xs font-medium', statusColors[conversation.status])}>{conversation.status}</Badge>
        <div className="relative group ml-2">
          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors font-medium">
            Move <ChevronDown className="w-3 h-3" />
          </button>
          <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 hidden group-hover:block z-10 min-w-32">
            {['open', 'qualified', 'closed'].map(s => (
              <button key={s} onClick={() => updateStatus(s)} className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize font-medium">{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Thread title */}
      <div className="px-6 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatPhone(conversation.customer_phone)} · {conversation.turn_count} messages
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
              {(conversation as Record<string, unknown>).stage as string || 'new'}
            </span>
            <p className="text-[10px] text-gray-400 mt-1">pipeline stage</p>
          </div>
        </div>
        {/* Source + Assign row */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Lead source tag */}
          <div className="relative">
            <button onClick={() => setShowSourcePicker(s => !s)}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                leadSource
                  ? SOURCE_OPTIONS.find(s => s.value === leadSource)?.color
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
              )}>
              <Tag className="w-3 h-3" />
              {leadSource ? SOURCE_OPTIONS.find(s => s.value === leadSource)?.label : 'Add source'}
            </button>
            {showSourcePicker && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-36">
                {SOURCE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setLeadSource(opt.value); setShowSourcePicker(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', opt.color.split(' ')[0])} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Assign to */}
          <div className="relative">
            <button onClick={() => setShowAssign(s => !s)}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
              title="Tag a team member on this lead">
              <UserCircle className="w-3 h-3" />
              {assignedTo === 'Unassigned' ? 'Assign' : assignedTo}
            </button>
            {showAssign && (
              <div className="absolute left-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-36">
                {STAFF_OPTIONS.map(s => (
                  <button key={s} onClick={() => { setAssignedTo(s); setShowAssign(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0 bg-[#f7f8fc]">
        {internalNotes.map(note => (
          <div key={note.id} className="flex justify-center">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 max-w-[85%] shadow-sm">
              <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 leading-relaxed">{note.text}</p>
                <p className="text-[10px] text-amber-400 mt-0.5">{note.author} · {note.time} · internal note</p>
              </div>
            </div>
          </div>
        ))}
        {messages.map((msg, i) => {
          const isOutbound = msg.direction === 'outbound'
          const showSender = i === 0 || messages[i-1]?.direction !== msg.direction
          return (
            <div key={msg.id}>
              {showSender && (
                <div className={cn('flex items-center gap-2 mb-1.5', isOutbound ? 'justify-end' : 'justify-start')}>
                  {!isOutbound && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[9px] font-semibold text-white">{displayName[0]}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400 font-medium">
                    {isOutbound ? 'RecMail AI' : displayName} · {format(new Date(msg.created_at), 'h:mm a')}
                  </span>
                </div>
              )}
              <div className={cn('flex flex-col', isOutbound ? 'items-end' : 'items-start pl-7')}>
                <div className={cn(
                  'max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                  isOutbound
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                )}>
                  {msg.body}
                </div>
                {isOutbound && (msg as Record<string, unknown>).delivery_status && (
                  <span className={cn('text-[10px] mt-0.5 font-medium',
                    (msg as Record<string, unknown>).delivery_status === 'delivered' ? 'text-emerald-500'
                    : (msg as Record<string, unknown>).delivery_status === 'failed' ? 'text-red-400'
                    : 'text-gray-400'
                  )}>
                    {String((msg as Record<string, unknown>).delivery_status)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {/* AI typing indicator */}
        {aiTyping && (
          <div className="flex justify-start pl-7">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 mr-1">RecMail AI</span>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply area */}
      <div className="px-5 pb-5 pt-3 flex-shrink-0 bg-white border-t border-gray-100">
        {/* Mode switcher */}
        <div className="flex items-center gap-1 mb-3">
          <button onClick={() => setNoteMode(false)}
            className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all',
              !noteMode ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
            )}>
            Reply
          </button>
          <button onClick={() => setNoteMode(true)}
            className={cn('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all',
              noteMode ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600'
            )}>
            <Lock className="w-3 h-3" /> Internal Note
          </button>
        </div>
        {/* Internal note compose */}
        {noteMode && (
          <div className="border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/50 mb-3">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100 bg-amber-50">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">Internal note — only visible to your team</span>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note for your team…"
              rows={3}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote() }}
              className="w-full text-sm px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-700 placeholder:text-amber-400"
            />
            <div className="flex items-center gap-2 px-4 py-2.5 border-t border-amber-100">
              <Button onClick={saveNote} disabled={!noteText.trim()}
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1.5 rounded-xl px-4 font-semibold shadow-sm disabled:opacity-50">
                Save Note
              </Button>
              <button onClick={() => { setNoteMode(false); setNoteText('') }} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Cancel</button>
              <span className="text-[10px] text-amber-300 font-medium ml-auto">⌘↩</span>
            </div>
          </div>
        )}

        {/* Quick templates panel */}
        {!noteMode && showTemplates && (
          <div className="mb-3 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700">Quick replies</span>
              </div>
              <button onClick={() => setShowTemplates(false)} className="p-0.5 rounded-md hover:bg-gray-200 transition-colors">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {GLOBAL_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => useTemplate(t.body)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors group">
                  <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">{t.title}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{t.body}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!noteMode && !replyOpen && (
          <div className="flex items-center gap-2">
            <button onClick={() => setReplyOpen(true)}
              className="flex-1 flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm text-left group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[11px] text-white font-semibold">R</span>
              </div>
              <span className="group-hover:text-gray-600 transition-colors">Reply to {displayName}…</span>
            </button>
            <button onClick={() => setShowTemplates(s => !s)}
              className={cn('flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2.5 border transition-all',
                showTemplates ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              )}>
              <Zap className="w-3.5 h-3.5" />
              Templates
            </button>
          </div>
        )}
        {!noteMode && replyOpen && (
          <div className="border border-gray-200 rounded-2xl shadow-md overflow-hidden bg-white">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-400 font-medium">To</span>
              <span className="text-xs font-semibold text-gray-700">{formatPhone(conversation.customer_phone)}</span>
              <span className="ml-auto text-[10px] font-semibold text-gray-300 tracking-wider uppercase">SMS</span>
            </div>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply…"
              className="border-0 resize-none focus-visible:ring-0 text-sm min-h-[90px] px-4 py-3 bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
                if (e.key === 'Escape') setReplyOpen(false)
              }}
            />
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50 border-t border-gray-100">
              <Button onClick={handleSend} disabled={!replyText.trim() || sending}
                className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs gap-2 rounded-xl px-4 font-semibold shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none">
                <Send className="w-3 h-3" />
                {sending ? 'Sending…' : 'Send'}
              </Button>
              <button onClick={() => setShowTemplates(s => !s)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors font-medium">
                <Zap className="w-3.5 h-3.5" />
                Templates
              </button>
              <span className="text-[10px] text-gray-300 font-medium">⌘↩</span>
              <div className="flex-1" />
              <button onClick={() => { setReplyOpen(false); setReplyText('') }} className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">Discard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
