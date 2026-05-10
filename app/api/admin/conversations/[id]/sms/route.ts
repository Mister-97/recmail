import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

async function assertAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await serviceSupabase.from('admins').select('user_id').eq('user_id', user.id).single()
  return data ? user : null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { data: conv } = await serviceSupabase
    .from('conversations')
    .select('customer_phone, client_id')
    .eq('id', id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('twilio_number')
    .eq('id', conv.client_id)
    .single()

  if (!client?.twilio_number) return NextResponse.json({ error: 'Client has no Twilio number' }, { status: 400 })

  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  const msg = await twilioClient.messages.create({
    from: client.twilio_number,
    to: conv.customer_phone,
    body: body.trim(),
  })

  await serviceSupabase.from('messages').insert({
    conversation_id: id,
    direction: 'outbound',
    body: body.trim(),
    twilio_sid: msg.sid,
  })

  await serviceSupabase.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    client_id: conv.client_id,
    action: 'manual_sms',
    details: { conversation_id: id, to: conv.customer_phone, body: body.trim() },
  })

  return NextResponse.json({ ok: true, sid: msg.sid })
}
