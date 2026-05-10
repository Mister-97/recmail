import { serviceSupabase } from '@/lib/supabase/service'
import Link from 'next/link'
import { Search, ExternalLink, MessageSquare, Building2 } from 'lucide-react'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  let clients: any[] = []
  let conversations: any[] = []

  if (query.length >= 2) {
    const [{ data: c }, { data: cv }] = await Promise.all([
      serviceSupabase
        .from('clients')
        .select('id, business_name, twilio_number, plan, plan_status, industry')
        .or(`business_name.ilike.%${query}%,twilio_number.ilike.%${query}%,industry.ilike.%${query}%`)
        .limit(20),
      serviceSupabase
        .from('conversations')
        .select('id, client_id, customer_phone, customer_name, status, turn_count, updated_at')
        .or(`customer_phone.ilike.%${query}%,customer_name.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(30),
    ])
    clients = c ?? []
    conversations = cv ?? []

    // Fetch client names for conversations
    const cIds = [...new Set(conversations.map((v: any) => v.client_id))]
    if (cIds.length > 0) {
      const { data: cls } = await serviceSupabase.from('clients').select('id, business_name').in('id', cIds)
      const map: Record<string, string> = {}
      for (const cl of cls ?? []) map[cl.id] = cl.business_name
      conversations = conversations.map((v: any) => ({ ...v, _bizName: map[v.client_id] }))
    }
  }

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }
  const statusColors: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700',
    qualified: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  const acctColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    churned: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-sm text-gray-400 mt-0.5">Search clients by name/number, or find conversations by customer phone</p>
      </div>

      {/* Search form */}
      <form method="GET" className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Business name, phone number, customer name..."
            autoFocus
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 shadow-sm"
          />
        </div>
      </form>

      {query.length >= 2 ? (
        <div className="space-y-6">
          {/* Clients */}
          {clients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Clients ({clients.length})</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {clients.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {c.business_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.business_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.twilio_number && <span className="text-[10px] font-mono text-gray-400">{c.twilio_number}</span>}
                          {c.industry && <span className="text-[10px] text-gray-400 capitalize">{c.industry}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${acctColors[c.plan_status ?? 'trial']}`}>
                        {c.plan_status ?? 'trial'}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${planColors[c.plan ?? 'starter']}`}>
                        {c.plan ?? 'starter'}
                      </span>
                      <Link href={`/admin/clients/${c.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          {conversations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-700">Conversations ({conversations.length})</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {conversations.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{v.customer_name || v.customer_phone}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{v._bizName}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[10px] font-mono text-gray-400">{v.customer_phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusColors[v.status]}`}>
                        {v.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{v.turn_count} turns</span>
                      <Link href={`/admin/conversations/${v.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                        Open <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clients.length === 0 && conversations.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          )}
        </div>
      ) : query.length > 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Type at least 2 characters to search.</p>
      ) : null}
    </div>
  )
}
