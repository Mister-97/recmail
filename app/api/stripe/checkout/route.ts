import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, customer_phone, amount_cents, business_name } = await request.json()

    if (!conversation_id || !customer_phone || !amount_cents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get Stripe key from client settings
    const { data: conv } = await serviceSupabase
      .from('conversations')
      .select('client_id')
      .eq('id', conversation_id)
      .single()

    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const { data: client } = await serviceSupabase
      .from('clients')
      .select('stripe_secret_key, deposit_amount')
      .eq('id', conv.client_id)
      .single()

    const stripeKey = client?.stripe_secret_key || process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: amount_cents,
          product_data: {
            name: `Booking Deposit — ${business_name || 'Service Appointment'}`,
            description: 'Applied to your final invoice. Confirms your appointment slot.',
          },
        },
        quantity: 1,
      }],
      metadata: {
        conversation_id,
        customer_phone,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/cancel?session_id={CHECKOUT_SESSION_ID}`,
    })

    return NextResponse.json({ url: session.url, session_id: session.id })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
