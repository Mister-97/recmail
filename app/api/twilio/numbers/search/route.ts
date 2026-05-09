import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const areaCode = searchParams.get('area_code')?.replace(/\D/g, '').slice(0, 3)

  if (!areaCode || areaCode.length !== 3) {
    return NextResponse.json({ error: 'Provide a 3-digit area code' }, { status: 400 })
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

  try {
    const numbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: parseInt(areaCode),
      smsEnabled: true,
      voiceEnabled: true,
      limit: 5,
    })

    return NextResponse.json({
      numbers: numbers.map(n => ({
        phone_number: n.phoneNumber,
        friendly_name: n.friendlyName,
        locality: n.locality,
        region: n.region,
      }))
    })
  } catch (err) {
    console.error('Twilio number search error:', err)
    return NextResponse.json({ error: 'Failed to search numbers' }, { status: 500 })
  }
}
