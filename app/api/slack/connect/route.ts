import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()

  const state = Buffer.from(profile?.client_id ?? user.id).toString('base64')

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: 'incoming-webhook',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/connect/callback`,
    state,
  })

  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params}`)
}
