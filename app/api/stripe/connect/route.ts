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

  // Get client id to use as state (CSRF protection)
  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()

  const clientId = profile?.client_id ?? user.id
  const state = Buffer.from(clientId).toString('base64')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CLIENT_ID!,
    scope: 'read_write',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`,
    state,
  })

  return NextResponse.redirect(`https://connect.stripe.com/oauth/authorize?${params}`)
}
