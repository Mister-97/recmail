import { serviceSupabase } from '@/lib/supabase/service'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import TeamActions from './TeamActions'

export default async function TeamPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminRow } = await serviceSupabase
    .from('admins')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .single()

  if (!adminRow) redirect('/dashboard')

  // All admins
  const { data: admins } = await serviceSupabase
    .from('admins')
    .select('user_id, is_super_admin, created_at')
    .order('created_at', { ascending: true })

  // Get emails
  const { data: { users: authUsers } } = await serviceSupabase.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) emailMap[u.id] = u.email ?? ''

  const adminList = (admins ?? []).map(a => ({
    user_id: a.user_id,
    email: emailMap[a.user_id] ?? 'Unknown',
    is_super_admin: a.is_super_admin ?? false,
    created_at: a.created_at,
  }))

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        </div>
        <p className="text-sm text-gray-400">
          {adminRow.is_super_admin
            ? 'You have super admin access. You can add or remove team members.'
            : 'You have admin access. Contact the super admin to manage team membership.'}
        </p>
      </div>

      <TeamActions admins={adminList} isSuperAdmin={adminRow.is_super_admin ?? false} />
    </div>
  )
}
