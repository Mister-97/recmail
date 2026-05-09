import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return new NextResponse('No client', { status: 403 })

  const { data: conversations } = await serviceSupabase
    .from('conversations')
    .select('id, customer_name, customer_phone, status, turn_count, created_at, updated_at')
    .eq('client_id', userRow.client_id)
    .order('created_at', { ascending: false })

  if (!conversations?.length) {
    const csv = 'Name,Phone,Status,Messages,Created,Updated\n'
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  }

  const header = ['Name', 'Phone', 'Status', 'Stage', 'Messages', 'Created', 'Updated']
  const rows = conversations.map(c => [
    c.customer_name ?? '',
    c.customer_phone,
    c.status,
    (c as Record<string, unknown>).stage ?? 'new',
    c.turn_count,
    new Date(c.created_at).toLocaleString(),
    new Date(c.updated_at).toLocaleString(),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [header.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
