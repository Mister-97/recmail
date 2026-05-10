import { serviceSupabase } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Clock } from 'lucide-react'
import AdminConversationActions from './AdminConversationActions'

type Props = { params: Promise<{ id: string }> }

export default async function AdminConversationPage({ params }: Props) {
  const { id } = await params

  const [{ data: conv }, { data: messages }, { data: summary }] = await Promise.all([
    serviceSupabase
      .from('conversations')
      .select('id, client_id, customer_phone, customer_name, status, turn_count, created_at, updated_at')
      .eq('id', id)
      .single(),
    serviceSupabase
      .from('messages')
      .select('id, direction, body, twilio_sid, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    serviceSupabase
      .from('summaries')
      .select('summary_text, lead_type, urgency, extracted_data')
      .eq('conversation_id', id)
      .single(),
  ])

  if (!conv) notFound()

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('business_name, twilio_number')
    .eq('id', conv.client_id)
    .single()

  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  const fmtTime = (d: string) => new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const extracted = summary?.extracted_data as Record<string, string> | null

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`/admin/clients/${conv.client_id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {client?.business_name ?? 'client'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
              {(conv.customer_name || conv.customer_phone).slice(-2)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{conv.customer_name || conv.customer_phone}</h1>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3" /> {conv.customer_phone}
                <span className="text-gray-200">·</span>
                {client?.business_name}
                <span className="text-gray-200">·</span>
                {conv.turn_count} turns
              </p>
            </div>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[conv.status]}`}>
          {conv.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Message thread */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-700">SMS Thread</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Started {fmtTime(conv.created_at)}</p>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {(messages ?? []).map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.direction === 'outbound'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.direction === 'outbound' ? 'AI' : 'Customer'} · {fmtTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {(messages ?? []).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet.</p>
              )}
            </div>
          </div>

          {/* Manual SMS */}
          <div className="mt-4">
            <AdminConversationActions conversationId={id} currentStatus={conv.status} />
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* AI Summary */}
          {summary && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-900 mb-3">AI Summary</h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Summary</p>
                  <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{summary.summary_text}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">Lead type</p>
                    <p className="text-xs font-semibold text-gray-700 capitalize mt-0.5">{summary.lead_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Urgency</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= (summary.urgency ?? 0) ? 'bg-orange-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {extracted && Object.keys(extracted).length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Extracted Data</p>
                    {Object.entries(extracted).map(([k, v]) => v ? (
                      <div key={k} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                        <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-gray-700 font-medium">{v}</span>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-900 mb-3">Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-[10px] text-gray-400">Customer</dt>
                <dd className="text-xs font-mono text-gray-700 mt-0.5">{conv.customer_phone}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400">Started</dt>
                <dd className="text-xs text-gray-700 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtTime(conv.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400">Last activity</dt>
                <dd className="text-xs text-gray-700 mt-0.5">{fmtTime(conv.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400">Conv ID</dt>
                <dd className="text-[10px] font-mono text-gray-400 mt-0.5 break-all">{conv.id}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
