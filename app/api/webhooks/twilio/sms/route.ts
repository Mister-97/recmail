import { NextRequest, NextResponse } from 'next/server'
import { validateTwilioSignature, sendSms } from '@/lib/twilio'
import { serviceSupabase } from '@/lib/supabase/service'
import { generateReply, generateSummary } from '@/lib/gemini'
import { buildSystemPrompt, END_KEYWORDS, SUMMARY_TRIGGER_TURNS } from '@/lib/ai-prompts'
import { scoreConversation } from '@/lib/qualify'
import Stripe from 'stripe'

const BOOKING_INTENT_KEYWORDS = [
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'sounds good', 'let\'s do it',
  'lets do it', 'book', 'schedule', 'when can', 'come out', 'send someone',
  'please come', 'that works', 'perfect', 'please schedule', 'i\'d like to',
  'id like to', 'go ahead', 'please book', 'available', 'appointment',
]

function hasBookingIntent(message: string): boolean {
  const lower = message.toLowerCase()
  return BOOKING_INTENT_KEYWORDS.some(kw => lower.includes(kw))
}

async function depositAlreadySent(conversationId: string): Promise<boolean> {
  const { data } = await serviceSupabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .ilike('body', '%stripe.com%')
    .limit(1)
  return (data?.length ?? 0) > 0
}

export async function POST(request: NextRequest) {
  const text = await request.text()
  const params = Object.fromEntries(new URLSearchParams(text))

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms`

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const customerPhone = params['From']
  const twilioNumber = params['To']
  const body = params['Body']?.trim()
  const messageSid = params['MessageSid']

  if (!customerPhone || !twilioNumber || !body) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Deduplicate — Twilio may retry if we're slow
  const { data: existing } = await serviceSupabase
    .from('messages')
    .select('id')
    .eq('twilio_sid', messageSid)
    .single()

  if (existing) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  try {
    // Look up client by Twilio number
    const { data: client, error: clientError } = await serviceSupabase
      .from('clients')
      .select('id, business_name, gemini_prompt_override, stripe_access_token, stripe_account_id, deposit_amount')
      .eq('twilio_number', twilioNumber)
      .single()

    if (clientError || !client) {
      console.error('No client found for number:', twilioNumber)
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Find open conversation, or reopen recent one
    let { data: conversation } = await serviceSupabase
      .from('conversations')
      .select('id, turn_count, status')
      .eq('client_id', client.id)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      // Unsolicited inbound — create a new conversation
      const { data: newConv } = await serviceSupabase
        .from('conversations')
        .insert({ client_id: client.id, customer_phone: customerPhone, status: 'open' })
        .select('id, turn_count, status')
        .single()
      conversation = newConv
    } else if (conversation.status !== 'open') {
      // Reopen if closed/qualified and recent (handled by DB — just update status)
      await serviceSupabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', conversation.id)
      conversation.status = 'open'
    }

    if (!conversation) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Insert inbound message
    await serviceSupabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      body,
      twilio_sid: messageSid,
    })

    // Increment turn count
    const newTurnCount = (conversation.turn_count ?? 0) + 1
    await serviceSupabase
      .from('conversations')
      .update({ turn_count: newTurnCount, updated_at: new Date().toISOString() })
      .eq('id', conversation.id)

    // Fetch full message history for AI context
    const { data: history } = await serviceSupabase
      .from('messages')
      .select('direction, body')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (!history || history.length === 0) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Generate AI reply
    const systemPrompt = buildSystemPrompt(client)
    const aiReply = await generateReply(history as { direction: 'inbound' | 'outbound'; body: string }[], systemPrompt)

    // Send SMS reply
    const replySid = await sendSms(customerPhone, twilioNumber, aiReply)

    // Store outbound message
    await serviceSupabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'outbound',
      body: aiReply,
      twilio_sid: replySid,
    })

    // Auto-deposit: if customer shows booking intent + Stripe connected + not already sent
    if (
      client.stripe_access_token &&
      client.deposit_amount &&
      hasBookingIntent(body) &&
      !(await depositAlreadySent(conversation.id))
    ) {
      try {
        const stripe = new Stripe(client.stripe_access_token, { apiVersion: '2026-04-22.dahlia' })
        const amountCents = Math.round(client.deposit_amount * 100)

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: `Booking Deposit — ${client.business_name}`,
                description: 'Applied to your final invoice. Confirms your appointment.',
              },
            },
            quantity: 1,
          }],
          metadata: { conversation_id: conversation.id, customer_phone: customerPhone },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/cancel?session_id={CHECKOUT_SESSION_ID}`,
        })

        if (session.url) {
          const depositMsg = `To confirm your appointment, please pay the $${client.deposit_amount} booking deposit here: ${session.url} — This is applied to your final invoice.`
          const depositSid = await sendSms(customerPhone, twilioNumber, depositMsg)
          await serviceSupabase.from('messages').insert({
            conversation_id: conversation.id,
            direction: 'outbound',
            body: depositMsg,
            twilio_sid: depositSid,
          })
        }
      } catch (err) {
        console.error('Auto-deposit error:', err)
        // Non-fatal — continue without deposit
      }
    }

    // Auto-qualify: score all inbound messages and promote status if threshold met
    if (conversation.status === 'open') {
      const inboundBodies = (history as { direction: string; body: string }[])
        .filter(m => m.direction === 'inbound')
        .map(m => m.body)
      const { qualified } = scoreConversation(inboundBodies)
      if (qualified) {
        await serviceSupabase
          .from('conversations')
          .update({ status: 'qualified' })
          .eq('id', conversation.id)
      }
    }

    // Trigger summary if conversation is long enough or customer is wrapping up
    const bodyLower = body.toLowerCase()
    const shouldSummarize =
      newTurnCount >= SUMMARY_TRIGGER_TURNS ||
      END_KEYWORDS.some((kw) => bodyLower.includes(kw))

    if (shouldSummarize) {
      // Run summarization async (don't await — don't block the response)
      generateSummary(
        history as { direction: 'inbound' | 'outbound'; body: string }[],
        client.business_name
      ).then(async (result) => {
        await serviceSupabase.from('summaries').upsert(
          {
            conversation_id: conversation!.id,
            summary_text: result.summary,
            lead_type: result.lead_type,
            urgency: result.urgency,
            extracted_data: result.extracted_data,
          },
          { onConflict: 'conversation_id' }
        )
      }).catch((err) => console.error('Summary generation failed:', err))
    }
  } catch (err) {
    console.error('SMS webhook error:', err)
    // Return 200 to prevent Twilio retry storm
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
