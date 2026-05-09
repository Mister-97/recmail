import { NextRequest, NextResponse } from 'next/server'
import { validateTwilioSignature } from '@/lib/twilio'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const text = await request.text()
  const params = Object.fromEntries(new URLSearchParams(text))

  const signature = request.headers.get('x-twilio-signature') ?? ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const messageSid = params['MessageSid']
  const messageStatus = params['MessageStatus'] // sent | delivered | failed | undelivered | read

  if (!messageSid || !messageStatus) {
    return new NextResponse('Missing params', { status: 400 })
  }

  // Update message delivery status
  await serviceSupabase
    .from('messages')
    .update({ delivery_status: messageStatus } as Record<string, unknown>)
    .eq('twilio_sid', messageSid)

  // If failed/undelivered, log for debugging
  if (messageStatus === 'failed' || messageStatus === 'undelivered') {
    const errorCode = params['ErrorCode']
    const errorMessage = params['ErrorMessage']
    console.error(`Message ${messageSid} ${messageStatus}: ${errorCode} — ${errorMessage}`)
  }

  return new NextResponse('', { status: 204 })
}
