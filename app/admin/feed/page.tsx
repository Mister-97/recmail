import { serviceSupabase } from '@/lib/supabase/service'
import Link from 'next/link'
import { Clock, ExternalLink, MessageSquare } from 'lucide-react'

export const revalidate = 0

export default async function FeedPage() {
  const { data: conversations } = await serviceSupabase
    .from('conversations')
    .select('id, client_id, customer_phone, customer_name, status, turn_count, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  const clientIds = [...new Set((conversations ?? []).map(c => c.client_id))]

  const { data: clients } = clientIds.length > 0
    ? await serviceSupabase.from('clients').select('id, business_name').in('id', clientIds)
    : { data: [] }

  const clientMap: Record<string, string> = {}
  for (const c of clients ?? []) clientMap[c.id] = c.business_name

  // Fetch latest message per conversation
  const convIds = (conversations ?? []).map(c => c.id)
  const { data: lastMessages } = convIds.length > 0
    ? await serviceSupabase
        .from('messages')
        .select('conversation_id, body, direction, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const lastMsgMap: Record<string, { body: string; direction: string }> = {}
  for (const m of lastMessages ?? []) {
    if (!lastMsgMap[m.conversation_id]) {
      lastMsgMap[m.conversation_id] = { body: m.body, direction: m.direction }
    }
  }

  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const convList = conversations ?? []
  const openCount = convList.filter(c => c.status === 'open').length

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">All conversations across every client — newest first</p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700">{openCount} open right now</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">{convList.length} conversations shown</p>
        </div>
        {convList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No conversations yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {convList.map(conv => {
              const lastMsg = lastMsgMap[conv.id]
              const bizName = clientMap[conv.client_id] ?? 'Unknown'
              return (
                <div key={conv.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors flex items-start gap-4">
                  {/* Status dot */}
                  <div className="mt-1 flex-shrink-0">
                    {conv.status === 'open'
                      ? <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                      : conv.status === 'qualified'
                      ? <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
                      : <span className="w-2 h-2 rounded-full bg-gray-200 block" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/admin/clients/${conv.client_id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                        {bizName}
                      </Link>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs font-medium text-gray-700">
                        {conv.customer_name || conv.customer_phone}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusColors[conv.status]}`}>
                        {conv.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{conv.turn_count} turns</span>
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate max-w-xl">
                        <span className={`font-medium ${lastMsg.direction === 'inbound' ? 'text-gray-700' : 'text-blue-600'}`}>
                          {lastMsg.direction === 'inbound' ? 'Customer: ' : 'AI: '}
                        </span>
                        {lastMsg.body}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fmtTime(conv.updated_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
