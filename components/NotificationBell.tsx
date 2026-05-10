'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, MessageSquare, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: 'new_lead' | 'qualified' | 'reply'
  title: string
  body: string
  href: string
  read: boolean
  time: string
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'new_lead', title: 'New missed call', body: 'Maria Rodriguez called and was sent an SMS', href: '/dashboard/mock-5', read: false, time: new Date(Date.now() - 1000*60*5).toISOString() },
  { id: 'n2', type: 'reply', title: 'New reply from James Martinez', body: '1842 Oak Ridge Drive, Fort Worth. Thank you so much', href: '/dashboard/mock-1', read: false, time: new Date(Date.now() - 1000*60*8).toISOString() },
  { id: 'n3', type: 'qualified', title: 'Lead qualified', body: 'Sarah Collins was auto-qualified by AI', href: '/dashboard/mock-2', read: true, time: new Date(Date.now() - 1000*60*35).toISOString() },
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell({ clientId }: { clientId?: string }) {
  const [open, setOpen] = useState(false)
  // Only show demo notifications for the explicit demo/unauthenticated view
  const [notifications, setNotifications] = useState<Notification[]>(
    clientId === 'mock-client' ? DEMO_NOTIFICATIONS : []
  )
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unread = notifications.filter(n => !n.read).length

  // Position panel when opened — anchors to top of button, opens downward
  function openPanel() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.top, left: rect.right + 8 })
    }
    setOpen(o => !o)
  }

  // Real-time: listen for new conversations & messages
  useEffect(() => {
    if (!clientId || clientId === 'mock-client') return

    const convChannel = supabase
      .channel('notif-conversations')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversations',
        filter: `client_id=eq.${clientId}`,
      }, (payload) => {
        const conv = payload.new as { id: string; customer_phone: string; customer_name: string | null }
        const name = conv.customer_name || conv.customer_phone
        const notif: Notification = {
          id: `conv-${conv.id}`,
          type: 'new_lead',
          title: 'New missed call',
          body: `${name} called and was sent an SMS`,
          href: `/dashboard/${conv.id}`,
          read: false,
          time: new Date().toISOString(),
        }
        setNotifications(prev => [notif, ...prev].slice(0, 20))
        if (Notification.permission === 'granted') {
          new Notification('New lead — RecMail', { body: notif.body, icon: '/favicon.ico' })
        }
      })
      .subscribe()

    const msgChannel = supabase
      .channel('notif-messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const msg = payload.new as { id: string; conversation_id: string; direction: string; body: string }
        if (msg.direction !== 'inbound') return
        const notif: Notification = {
          id: `msg-${msg.id}`,
          type: 'reply',
          title: 'New reply',
          body: msg.body.slice(0, 80),
          href: `/dashboard/${msg.conversation_id}`,
          read: false,
          time: new Date().toISOString(),
        }
        setNotifications(prev => [notif, ...prev].slice(0, 20))
        if (Notification.permission === 'granted') {
          new Notification('New reply — RecMail', { body: notif.body, icon: '/favicon.ico' })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(convChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [clientId, supabase])

  // Request push permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function markAllRead() {
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  function dismiss(id: string) {
    setNotifications(n => n.filter(x => x.id !== id))
  }

  const iconBg: Record<Notification['type'], string> = {
    new_lead: 'bg-blue-50 text-blue-500',
    reply: 'bg-violet-50 text-violet-500',
    qualified: 'bg-emerald-50 text-emerald-500',
  }

  const Icon = ({ type }: { type: Notification['type'] }) => {
    if (type === 'new_lead') return <MessageSquare className="w-3.5 h-3.5" />
    if (type === 'qualified') return <CheckCircle2 className="w-3.5 h-3.5" />
    return <MessageSquare className="w-3.5 h-3.5" />
  }

  const panel = open && panelPos ? (
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999 }}
      className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Notifications</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread} new</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">No notifications</div>
        ) : (
          notifications.map(n => (
            <div key={n.id}
              className={cn('flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors group', !n.read && 'bg-blue-50/40')}
              onClick={() => { router.push(n.href); setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); setOpen(false) }}
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', iconBg[n.type])}>
                <Icon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-xs leading-tight', n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900')}>{n.title}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(n.time)}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-tight">{n.body}</p>
              </div>
              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                onClick={e => { e.stopPropagation(); dismiss(n.id) }}>
                <X className="w-3 h-3 text-gray-300 hover:text-gray-500" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPanel}
        className={cn(
          'relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
          open ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-200/70 hover:text-gray-600'
        )}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
