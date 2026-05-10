import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serviceSupabase } from '@/lib/supabase/service'

async function getUserFromBearer(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

async function getClientId(userId: string) {
  const { data } = await serviceSupabase
    .from('users').select('client_id').eq('id', userId).single()
  return data?.client_id ?? null
}

export async function GET(request: NextRequest) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await getClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'No client' }, { status: 404 })

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('business_name, twilio_number, owner_phone, industry, gemini_prompt_override, price_list, deposit_amount, stripe_account_id, slack_webhook_url, slack_channel, slack_workspace, slack_trigger, avg_job_value, referral_code, business_hours_start, business_hours_end, business_hours_days')
    .eq('id', clientId)
    .single()

  return NextResponse.json({ client, client_id: clientId })
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = await getClientId(user.id)
  if (!clientId) return NextResponse.json({ error: 'No client' }, { status: 404 })

  const body = await request.json()

  const allowed = [
    'business_name', 'owner_phone', 'industry',
    'gemini_prompt_override', 'price_list', 'deposit_amount',
    'slack_trigger', 'avg_job_value',
    'business_hours_start', 'business_hours_end', 'business_hours_days',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await serviceSupabase.from('clients').update(updates).eq('id', clientId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
