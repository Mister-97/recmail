import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()

  if (!profile?.client_id) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  await serviceSupabase
    .from('clients')
    .update({ slack_webhook_url: null, slack_channel: null, slack_workspace: null })
    .eq('id', profile.client_id)

  return NextResponse.json({ ok: true })
}
