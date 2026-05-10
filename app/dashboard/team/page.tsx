import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import TeamManager from './TeamManager'

export default async function TeamPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRow } = await supabase.from('users').select('client_id, role').eq('id', user.id).single()
  if (!userRow?.client_id) redirect('/dashboard')

  const [{ data: members }, { data: pendingInvites }] = await Promise.all([
    serviceSupabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .eq('client_id', userRow.client_id)
      .order('created_at'),
    serviceSupabase
      .from('team_invites')
      .select('id, email, role, created_at, expires_at')
      .eq('client_id', userRow.client_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ])

  const canManage = ['owner', 'admin'].includes(userRow.role)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage who has access to your RecMail inbox</p>
      </div>
      <TeamManager
        members={(members ?? []).map(m => ({ ...m, isSelf: m.id === user.id }))}
        pendingInvites={pendingInvites ?? []}
        canManage={canManage}
        currentUserId={user.id}
      />
    </div>
  )
}
