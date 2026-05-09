import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serviceSupabase } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`

  if (error || !code || !state) {
    return NextResponse.redirect(`${redirectBase}?slack=error&msg=${error ?? 'cancelled'}`)
  }

  let clientId: string
  try {
    clientId = Buffer.from(state, 'base64').toString('utf8')
  } catch {
    return NextResponse.redirect(`${redirectBase}?slack=error&msg=invalid_state`)
  }

  // Exchange code for token
  const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/connect/callback`,
    }),
  })

  const token = await tokenRes.json()

  if (!token.ok || !token.incoming_webhook?.url) {
    console.error('Slack OAuth error:', token.error)
    return NextResponse.redirect(`${redirectBase}?slack=error&msg=${token.error ?? 'no_webhook'}`)
  }

  // Verify ownership
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()

  if (profile?.client_id !== clientId) {
    return NextResponse.redirect(`${redirectBase}?slack=error&msg=unauthorized`)
  }

  await serviceSupabase
    .from('clients')
    .update({
      slack_webhook_url: token.incoming_webhook.url,
      slack_channel: token.incoming_webhook.channel,
      slack_workspace: token.team?.name,
    })
    .eq('id', clientId)

  return NextResponse.redirect(`${redirectBase}?slack=connected&channel=${encodeURIComponent(token.incoming_webhook.channel)}&workspace=${encodeURIComponent(token.team?.name ?? '')}`)
}
