import { NextRequest, NextResponse } from 'next/server'
import { validateTwilioSignature, sendSms } from '@/lib/twilio'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  // Parse form-encoded body
  const text = await request.text()
  const params = Object.fromEntries(new URLSearchParams(text))

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const customerPhone = params['From']
  const twilioNumber = params['To']
  const callStatus = params['CallStatus']

  // For active/ringing calls — look up business name and play voicemail-style message
  const missedStatuses = ['no-answer', 'busy', 'failed', 'canceled']
  if (!missedStatuses.includes(callStatus)) {
    const { data: calledClient } = await serviceSupabase
      .from('clients')
      .select('business_name')
      .eq('twilio_number', twilioNumber)
      .single()

    const businessName = calledClient?.business_name ?? 'us'

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew">You've reached ${businessName}. We're unavailable right now — leave us a message or we'll follow up with you shortly.</Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }

  try {
    // Look up client by Twilio number
    const { data: client, error: clientError } = await serviceSupabase
      .from('clients')
      .select('id, business_name')
      .eq('twilio_number', twilioNumber)
      .single()

    if (clientError || !client) {
      console.error('No client found for number:', twilioNumber)
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Check for existing open conversation (avoid duplicate outreach on redials)
    const { data: existing } = await serviceSupabase
      .from('conversations')
      .select('id')
      .eq('client_id', client.id)
      .eq('customer_phone', customerPhone)
      .eq('status', 'open')
      .single()

    if (existing) {
      // Already in conversation, don't send another opener
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Create the conversation
    const { data: conversation, error: convError } = await serviceSupabase
      .from('conversations')
      .insert({
        client_id: client.id,
        customer_phone: customerPhone,
        status: 'open',
        turn_count: 0,
      })
      .select('id')
      .single()

    if (convError || !conversation) {
      console.error('Failed to create conversation:', convError)
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Send the first SMS
    const firstMessage = `Hi! You just called ${client.business_name} and we missed you. We would love to help. What can we do for you today?`

    const twilioSid = await sendSms(customerPhone, twilioNumber, firstMessage)

    // Store the outbound message
    await serviceSupabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'outbound',
      body: firstMessage,
      twilio_sid: twilioSid,
    })
  } catch (err) {
    console.error('Voice webhook error:', err)
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
