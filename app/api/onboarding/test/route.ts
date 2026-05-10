import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import twilio from 'twilio'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client' }, { status: 404 })

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('twilio_number, business_name')
    .eq('id', userRow.client_id)
    .single()

  if (!client?.twilio_number) {
    return NextResponse.json({ error: 'No Twilio number provisioned yet' }, { status: 400 })
  }

  const { phone } = await request.json()
  if (!phone?.trim()) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  try {
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    await twilioClient.messages.create({
      from: client.twilio_number,
      to: phone.trim(),
      body: `Test from ${client.business_name ?? 'RecMail'}: Your AI receptionist is live! When someone misses your call, they'll get a text like this automatically.`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to send test SMS' }, { status: 500 })
  }
}
