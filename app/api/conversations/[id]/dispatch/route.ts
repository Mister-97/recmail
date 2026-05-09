import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { tech_name, eta_minutes } = await request.json()
  if (!tech_name) return new NextResponse('tech_name required', { status: 400 })

  const { data: conv } = await serviceSupabase
    .from('conversations')
    .select('id, customer_phone, client_id')
    .eq('id', params.id)
    .single()

  if (!conv) return new NextResponse('Not found', { status: 404 })

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('business_name, twilio_number')
    .eq('id', conv.client_id)
    .single()

  if (!client) return new NextResponse('Client not found', { status: 404 })

  const eta = eta_minutes ?? 30
  const body = `Good news! ${tech_name} from ${client.business_name} is on the way and should arrive in about ${eta} minutes. Let us know if you have any questions!`

  const twilioSid = await sendSms(conv.customer_phone, client.twilio_number, body)

  await serviceSupabase.from('messages').insert({
    conversation_id: conv.id,
    direction: 'outbound',
    body,
    twilio_sid: twilioSid,
  })

  // Update conversation stage to dispatched
  await serviceSupabase
    .from('conversations')
    .update({ stage: 'dispatched' })
    .eq('id', conv.id)

  return NextResponse.json({ ok: true })
}
