import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()

  const { businessName, industry, ownerPhone, promptOverride } = await request.json()

  const updates: Record<string, unknown> = { onboarding_complete: true }
  if (businessName?.trim()) updates.business_name = businessName.trim()
  if (industry) updates.industry = industry
  if (ownerPhone?.trim()) updates.owner_phone = ownerPhone.trim()
  if (promptOverride?.trim()) updates.gemini_prompt_override = promptOverride.trim()

  let clientId = userRow?.client_id

  if (!clientId) {
    // First time — create a client row for this user
    const { data: newClient, error: createErr } = await serviceSupabase
      .from('clients')
      .insert({ ...updates, owner_id: user.id })
      .select('id')
      .single()

    if (createErr || !newClient) {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to create client' }, { status: 500 })
    }

    clientId = newClient.id

    // Link user to the new client
    await serviceSupabase.from('users').update({ client_id: clientId, email: user.email }).eq('id', user.id)
  } else {
    const { error } = await serviceSupabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await serviceSupabase.from('users').update({ email: user.email }).eq('id', user.id)
  }

  return NextResponse.json({ ok: true })
}
