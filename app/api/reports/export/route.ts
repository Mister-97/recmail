import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client' }, { status: 403 })

  const { data: convs } = await supabase
    .from('conversations')
    .select('id, customer_name, customer_phone, status, turn_count, created_at, updated_at')
    .eq('client_id', userRow.client_id)
    .order('created_at', { ascending: false })

  const { data: summaries } = await supabase
    .from('summaries')
    .select('conversation_id, summary_text, lead_type, urgency, extracted_data')
    .in('conversation_id', (convs ?? []).map(c => c.id))

  const sumMap: Record<string, any> = {}
  for (const s of summaries ?? []) sumMap[s.conversation_id] = s

  const rows = (convs ?? []).map(c => {
    const s = sumMap[c.id]
    const ext = s?.extracted_data ?? {}
    return [
      c.customer_name ?? '',
      c.customer_phone,
      c.status,
      c.turn_count,
      s?.lead_type ?? '',
      s?.urgency ?? '',
      s?.summary_text?.replace(/"/g, "'") ?? '',
      ext.name ?? '',
      ext.service ?? '',
      ext.address ?? '',
      ext.preferred_time ?? '',
      new Date(c.created_at).toLocaleDateString('en-US'),
      new Date(c.updated_at).toLocaleDateString('en-US'),
    ]
  })

  const header = ['Customer Name', 'Phone', 'Status', 'Turns', 'Lead Type', 'Urgency', 'Summary', 'Contact Name', 'Service', 'Address', 'Preferred Time', 'Date', 'Last Updated']
  const csv = [header, ...rows]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="recmail-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
