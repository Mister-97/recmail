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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const superAdmin = await assertSuperAdmin()
  if (!superAdmin) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { userId } = await params

  if (userId === superAdmin.id) {
    return NextResponse.json({ error: 'Cannot remove yourself.' }, { status: 400 })
  }

  // Cannot remove another super admin
  const { data: target } = await serviceSupabase.from('admins').select('is_super_admin').eq('user_id', userId).single()
  if (target?.is_super_admin) {
    return NextResponse.json({ error: 'Cannot remove a super admin.' }, { status: 400 })
  }

  const { error } = await serviceSupabase.from('admins').delete().eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await serviceSupabase.from('admin_audit_log').insert({
    admin_user_id: superAdmin.id,
    client_id: null,
    action: 'remove_admin',
    details: { user_id: userId },
  })

  return NextResponse.json({ ok: true })
}
