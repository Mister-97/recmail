import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { conversation_id, customer_phone } = session.metadata ?? {}

    if (!conversation_id || !customer_phone) {
      return NextResponse.json({ received: true })
    }

    const amountPaid = session.amount_total ?? 0

    try {
      // Look up client for this conversation
      const { data: conv } = await serviceSupabase
        .from('conversations')
        .select('client_id, customer_name')
        .eq('id', conversation_id)
        .single()

      if (!conv) return NextResponse.json({ received: true })

      const { data: client } = await serviceSupabase
        .from('clients')
        .select('business_name, twilio_number')
        .eq('id', conv.client_id)
        .single()

      // Mark conversation as qualified (booked)
      await serviceSupabase
        .from('conversations')
        .update({ status: 'qualified', updated_at: new Date().toISOString() })
        .eq('id', conversation_id)

      // Insert a system message recording the payment
      await serviceSupabase.from('messages').insert({
        conversation_id,
        direction: 'outbound',
        body: `Deposit of $${(amountPaid / 100).toFixed(2)} collected via Stripe. Appointment confirmed.`,
      })

      // Send confirmation SMS to customer
      if (client?.twilio_number) {
        const firstName = conv.customer_name?.split(' ')[0] || 'there'
        const confirmMsg = `Hi ${firstName}! Your deposit of $${(amountPaid / 100).toFixed(2)} has been received. Your appointment with ${client.business_name} is confirmed. We will send a reminder before your visit. Thank you!`
        await sendSms(customer_phone, client.twilio_number, confirmMsg)
      }

      console.log(`Deposit confirmed for conversation ${conversation_id}, amount: $${amountPaid / 100}`)
    } catch (err) {
      console.error('Error processing Stripe payment confirmation:', err)
    }
  }

  return NextResponse.json({ received: true })
}
