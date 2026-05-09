import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('stripe_account_id')
    .eq('id', profile.client_id)
    .single()

  // Deauthorize from Stripe platform
  if (client?.stripe_account_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
      await stripe.oauth.deauthorize({
        client_id: process.env.STRIPE_CLIENT_ID!,
        stripe_user_id: client.stripe_account_id,
      })
    } catch (err) {
      // Non-fatal — still clear locally even if Stripe deauth fails
      console.error('Stripe deauth error:', err)
    }
  }

  await serviceSupabase
    .from('clients')
    .update({ stripe_account_id: null, stripe_access_token: null })
    .eq('id', profile.client_id)

  return NextResponse.json({ ok: true })
}
