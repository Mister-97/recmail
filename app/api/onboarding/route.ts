import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client linked' }, { status: 404 })

  const { businessName, industry, ownerPhone, promptOverride } = await request.json()

  const updates: Record<string, unknown> = { onboarding_complete: true }
  if (businessName?.trim()) updates.business_name = businessName.trim()
  if (industry) updates.industry = industry
  if (ownerPhone?.trim()) updates.owner_phone = ownerPhone.trim()
  if (promptOverride?.trim()) updates.gemini_prompt_override = promptOverride.trim()

  const { error } = await serviceSupabase
    .from('clients')
    .update(updates)
    .eq('id', userRow.client_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also update the users row with full_name if provided
  await serviceSupabase.from('users').update({ email: user.email }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
