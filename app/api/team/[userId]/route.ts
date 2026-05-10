import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id, role').eq('id', user.id).single()
  if (!userRow?.client_id || !['owner', 'admin'].includes(userRow.role)) {
    return NextResponse.json({ error: 'Owner or admin only' }, { status: 403 })
  }

  const { userId } = await params
  if (userId === user.id) return NextResponse.json({ error: 'Cannot remove yourself.' }, { status: 400 })

  // Verify the target belongs to the same client
  const { data: target } = await serviceSupabase
    .from('users').select('role, client_id').eq('id', userId).single()
  if (!target || target.client_id !== userRow.client_id) {
    return NextResponse.json({ error: 'User not found on your team.' }, { status: 404 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the account owner.' }, { status: 400 })
  }

  await serviceSupabase.from('users').delete().eq('id', userId)
  return NextResponse.json({ ok: true })
}
