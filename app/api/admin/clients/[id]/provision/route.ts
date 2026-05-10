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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const areaCode = searchParams.get('area_code') ?? '800'

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    const numbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: Number(areaCode),
      limit: 10,
      smsEnabled: true,
      voiceEnabled: true,
    })
    return NextResponse.json({ numbers: numbers.map(n => ({ phone: n.phoneNumber, friendly: n.friendlyName, locality: n.locality, region: n.region })) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to search numbers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { phone_number } = await request.json()
  if (!phone_number) return NextResponse.json({ error: 'phone_number required' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  try {
    const incoming = await client.incomingPhoneNumbers.create({
      phoneNumber: phone_number,
      voiceUrl: `${appUrl}/api/webhooks/twilio/voice`,
      voiceMethod: 'POST',
      smsUrl: `${appUrl}/api/webhooks/twilio/sms`,
      smsMethod: 'POST',
      friendlyName: `RecMail — ${id}`,
    })

    await serviceSupabase.from('clients').update({
      twilio_number: incoming.phoneNumber,
      twilio_number_sid: incoming.sid,
    }).eq('id', id)

    await serviceSupabase.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      client_id: id,
      action: 'provision_number',
      details: { phone_number: incoming.phoneNumber, sid: incoming.sid },
    })

    return NextResponse.json({ phone_number: incoming.phoneNumber, sid: incoming.sid })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to provision number' }, { status: 500 })
  }
}
