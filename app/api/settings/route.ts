import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id, role').eq('id', user.id).single()
  if (!userRow?.client_id) return new NextResponse('No client', { status: 403 })
  if (userRow.role !== 'owner' && userRow.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  const body = await request.json()

  const {
    business_name,
    gemini_prompt_override,
    slack_webhook,
    slack_trigger,
    review_url,
  } = body

  // Update client record
  const clientUpdate: Record<string, unknown> = {}
  if (business_name !== undefined) clientUpdate.business_name = business_name
  if (gemini_prompt_override !== undefined) clientUpdate.gemini_prompt_override = gemini_prompt_override
  if (slack_webhook !== undefined) clientUpdate.slack_webhook = slack_webhook
  if (slack_trigger !== undefined) clientUpdate.slack_trigger = slack_trigger
  if (review_url !== undefined) clientUpdate.review_url = review_url

  if (Object.keys(clientUpdate).length > 0) {
    const { error } = await serviceSupabase
      .from('clients')
      .update(clientUpdate)
      .eq('id', userRow.client_id)

    if (error) {
      console.error('Settings update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Update user record (owner phone)
  if (body.owner_phone !== undefined) {
    await serviceSupabase
      .from('users')
      .update({ phone: body.owner_phone } as Record<string, unknown>)
      .eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
