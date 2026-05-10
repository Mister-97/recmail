import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

async function assertSuperAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await serviceSupabase
    .from('admins')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()
  return data?.is_super_admin ? user : null
}

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: adminRow } = await serviceSupabase
    .from('admins')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: admins } = await serviceSupabase
    .from('admins')
    .select('user_id, is_super_admin, created_at')
    .order('created_at', { ascending: true })

  // Get emails from auth.users via admin API
  const { data: { users: authUsers } } = await serviceSupabase.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) emailMap[u.id] = u.email ?? ''

  return NextResponse.json({
    admins: (admins ?? []).map(a => ({
      user_id: a.user_id,
      email: emailMap[a.user_id] ?? 'Unknown',
      is_super_admin: a.is_super_admin,
      created_at: a.created_at,
    })),
    is_super_admin: adminRow.is_super_admin,
  })
}

export async function POST(request: NextRequest) {
  const superAdmin = await assertSuperAdmin()
  if (!superAdmin) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Find user by email
  const { data: { users } } = await serviceSupabase.auth.admin.listUsers()
  const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim())
  if (!target) return NextResponse.json({ error: 'No account found with that email. They must sign up first.' }, { status: 404 })

  // Check not already admin
  const { data: existing } = await serviceSupabase.from('admins').select('user_id').eq('user_id', target.id).single()
  if (existing) return NextResponse.json({ error: 'This user is already an admin.' }, { status: 409 })

  const { error } = await serviceSupabase.from('admins').insert({ user_id: target.id, is_super_admin: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await serviceSupabase.from('admin_audit_log').insert({
    admin_user_id: superAdmin.id,
    client_id: null,
    action: 'add_admin',
    details: { email, user_id: target.id },
  })

  return NextResponse.json({ ok: true, email, user_id: target.id })
}
