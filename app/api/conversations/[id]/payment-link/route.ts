import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const { amount, note } = await request.json()
  if (!amount || amount <= 0) return new NextResponse('Invalid amount', { status: 400 })

  // Get conversation + client
  const { data: conv } = await serviceSupabase
    .from('conversations')
    .select('id, customer_phone, client_id')
    .eq('id', id)
    .single()

  if (!conv) return new NextResponse('Not found', { status: 404 })

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('business_name, twilio_number')
    .eq('id', conv.client_id)
    .single()

  if (!client) return new NextResponse('Client not found', { status: 404 })

  // Build a Stripe payment link URL (requires STRIPE_SECRET_KEY in env)
  // For now we construct a placeholder deep link; swap for real Stripe API call when ready
  const paymentUrl = process.env.STRIPE_PAYMENT_BASE_URL
    ? `${process.env.STRIPE_PAYMENT_BASE_URL}?amount=${Math.round(amount * 100)}&client=${conv.client_id}`
    : `https://pay.recmail.io/${conv.client_id}?amount=${amount}`

  const noteText = note ? ` (${note})` : ''
  const body = `Hi! Here is your payment link for ${client.business_name}${noteText}: ${paymentUrl} — Total: $${amount}. Thank you!`

  const twilioSid = await sendSms(conv.customer_phone, client.twilio_number, body)

  await serviceSupabase.from('messages').insert({
    conversation_id: conv.id,
    direction: 'outbound',
    body,
    twilio_sid: twilioSid,
  })

  return NextResponse.json({ ok: true })
}
