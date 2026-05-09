import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { webhook_url } = await request.json()

  if (!webhook_url || !webhook_url.startsWith('https://hooks.slack.com/')) {
    return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
  }

  const res = await fetch(webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: '✅ *RecMail is connected!* Your Slack alerts are working. New qualified leads will be posted here automatically.',
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Slack returned an error. Check your webhook URL.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
