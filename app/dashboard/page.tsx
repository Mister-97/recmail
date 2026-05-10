import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import ConversationList from '@/components/inbox/ConversationList'
import { Conversation } from '@/types/database'

const MOCK_CONVERSATIONS = [
  {
    id: 'mock-1',
    client_id: 'mock-client',
    customer_phone: '+18175550101',
    customer_name: 'James Martinez',
    status: 'open' as const,
    turn_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    last_message: 'AC stopped working last night - Yes my unit stopped cooling around 11pm',
  },
  {
    id: 'mock-2',
    client_id: 'mock-client',
    customer_phone: '+18175550182',
    customer_name: 'Sarah Collins',
    status: 'qualified' as const,
    turn_count: 6,
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    last_message: 'Heating tune-up booked - Perfect, see you Thursday morning between 8–10am!',
  },
  {
    id: 'mock-3',
    client_id: 'mock-client',
    customer_phone: '+18175550247',
    customer_name: null,
    status: 'open' as const,
    turn_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    last_message: 'Roof repair quote needed - I need someone to come look at storm damage',
  },
  {
    id: 'mock-4',
    client_id: 'mock-client',
    customer_phone: '+18175550319',
    customer_name: 'David Kim',
    status: 'closed' as const,
    turn_count: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    last_message: 'Plumbing repair complete - Thanks David, our team will be there Monday at 9am',
  },
  {
    id: 'mock-5',
    client_id: 'mock-client',
    customer_phone: '+18175550488',
    customer_name: 'Maria Rodriguez',
    status: 'open' as const,
    turn_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    last_message: 'Emergency leak - Water is coming through my ceiling right now',
  },
  {
    id: 'mock-6',
    client_id: 'mock-client',
    customer_phone: '+18175550561',
    customer_name: 'Carlos Rivera',
    status: 'qualified' as const,
    turn_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    last_message: 'AC tune-up scheduled - Wednesday at 2pm works great, thank you',
  },
  {
    id: 'mock-7',
    client_id: 'mock-client',
    customer_phone: '+18175550634',
    customer_name: 'Linda Chen',
    status: 'qualified' as const,
    turn_count: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    last_message: 'Water heater replacement - Yes please send someone out Friday',
  },
  {
    id: 'mock-8',
    client_id: 'mock-client',
    customer_phone: '+18175550532',
    customer_name: 'Tony Reyes',
    status: 'open' as const,
    turn_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    last_message: 'HVAC replacement quote - My system is 18 years old and keeps breaking',
  },
  {
    id: 'mock-9',
    client_id: 'mock-client',
    customer_phone: '+18175550709',
    customer_name: 'Priya Sharma',
    status: 'open' as const,
    turn_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    last_message: 'Electrical panel upgrade - Need 200 amp service for EV charger',
  },
]

type SearchParams = Promise<{ status?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const activeTab = (status && ['open', 'qualified', 'closed'].includes(status)) ? status : 'open'
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <ConversationList
        initialConversations={MOCK_CONVERSATIONS}
        clientId="mock-client"
        activeTab={activeTab}
      />
    )
  }

  const { data: userRow } = await supabase
    .from('users').select('client_id').eq('id', user.id).single()

  if (!userRow?.client_id) {
    // Check if this user is a RecMail admin — redirect them to the team portal
    const { data: adminRow } = await serviceSupabase
      .from('admins').select('user_id').eq('user_id', user.id).single()
    if (adminRow) redirect('/admin')

    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">No business linked to this account. Contact your admin.</p>
      </div>
    )
  }

  let query = supabase
    .from('conversations').select('*')
    .eq('client_id', userRow.client_id)
    .order('updated_at', { ascending: false })

  if (activeTab !== 'open') query = query.eq('status', activeTab)

  const { data: conversations } = await query

  const conversationsWithPreview = await Promise.all(
    (conversations ?? []).map(async (conv: Conversation) => {
      const { data: lastMsg } = await supabase
        .from('messages').select('body, direction')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1).single()

      return {
        ...conv,
        last_message: lastMsg
          ? `${lastMsg.direction === 'outbound' ? 'You: ' : ''}${lastMsg.body}`
          : undefined,
      }
    })
  )

  return (
    <ConversationList
      initialConversations={conversationsWithPreview}
      clientId={userRow.client_id}
      activeTab={activeTab}
    />
  )
}
