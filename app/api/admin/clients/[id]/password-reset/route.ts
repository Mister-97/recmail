import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

async function assertAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await serviceSupabase.from('admins').select('user_id').eq('user_id', user.id).single()
  return data ? user : null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Get the client's owner email
  const { data: clientUser } = await serviceSupabase
    .from('users')
    .select('email, id')
    .eq('client_id', id)
    .eq('role', 'owner')
    .single()

  if (!clientUser?.email) return NextResponse.json({ error: 'No owner found for this client' }, { status: 404 })

  const { data, error } = await serviceSupabase.auth.admin.generateLink({
    type: 'recovery',
    email: clientUser.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await serviceSupabase.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    client_id: id,
    action: 'password_reset',
    details: { email: clientUser.email },
  })

  return NextResponse.json({ ok: true, email: clientUser.email, link: data.properties?.action_link })
}
