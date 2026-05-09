import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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
    return NextResponse.redirect(`${redirectBase}?stripe=error&msg=${error ?? 'cancelled'}`)
  }

  // Decode client id from state
  let clientId: string
  try {
    clientId = Buffer.from(state, 'base64').toString('utf8')
  } catch {
    return NextResponse.redirect(`${redirectBase}?stripe=error&msg=invalid_state`)
  }

  // Exchange code for access token
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })
  let token: Stripe.OAuthToken
  try {
    token = await stripe.oauth.token({ grant_type: 'authorization_code', code })
  } catch (err) {
    console.error('Stripe OAuth token exchange failed:', err)
    return NextResponse.redirect(`${redirectBase}?stripe=error&msg=token_exchange_failed`)
  }

  // Verify the user owns this client_id
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
    return NextResponse.redirect(`${redirectBase}?stripe=error&msg=unauthorized`)
  }

  // Store tokens
  await serviceSupabase
    .from('clients')
    .update({
      stripe_account_id: token.stripe_user_id,
      stripe_access_token: token.access_token,
    })
    .eq('id', clientId)

  return NextResponse.redirect(`${redirectBase}?stripe=connected`)
}
