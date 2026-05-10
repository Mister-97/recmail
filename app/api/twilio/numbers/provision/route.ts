import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone_number } = await request.json()
  if (!phone_number) return NextResponse.json({ error: 'phone_number required' }, { status: 400 })

  const { data: profile } = await serviceSupabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()

  if (!profile?.client_id) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  try {
    // Purchase the number
    const incoming = await client.incomingPhoneNumbers.create({
      phoneNumber: phone_number,
      voiceUrl: `${appUrl}/api/webhooks/twilio/voice`,
      voiceMethod: 'POST',
      smsUrl: `${appUrl}/api/webhooks/twilio/sms`,
      smsMethod: 'POST',
      friendlyName: `RecMail — ${profile.client_id}`,
    })

    // Save to client record
    await serviceSupabase
      .from('clients')
      .update({
        twilio_number: incoming.phoneNumber,
        twilio_number_sid: incoming.sid,
      })
      .eq('id', profile.client_id)

    return NextResponse.json({
      phone_number: incoming.phoneNumber,
      sid: incoming.sid,
    })
  } catch (err: any) {
    console.error('Twilio provision error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to provision number' }, { status: 500 })
  }
}
