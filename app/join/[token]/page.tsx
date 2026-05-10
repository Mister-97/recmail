import { serviceSupabase } from '@/lib/supabase/service'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react'

type Props = { params: Promise<{ token: string }> }

export default async function JoinPage({ params }: Props) {
  const { token } = await params

  const { data: invite } = await serviceSupabase
    .from('team_invites')
    .select('id, client_id, email, role, accepted_at, expires_at')
    .eq('token', token)
    .single()

  if (!invite) {
    return <ErrorPage msg="This invite link is invalid or has already been used." />
  }

  if (invite.accepted_at) {
    return <ErrorPage msg="This invite has already been accepted." />
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <ErrorPage msg="This invite link has expired. Ask your team owner to send a new one." />
  }

  const { data: client } = await serviceSupabase
    .from('clients')
    .select('business_name')
    .eq('id', invite.client_id)
    .single()

  // Check if user is already logged in
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // If logged in, link them to the client if email matches
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return (
        <CenterCard>
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Wrong account</h2>
          <p className="text-sm text-gray-500 mb-4">
            This invite was sent to <strong>{invite.email}</strong>, but you're signed in as <strong>{user.email}</strong>.
          </p>
          <p className="text-sm text-gray-500">Sign out and create an account with the invited email, or ask for a new invite.</p>
        </CenterCard>
      )
    }

    // Accept the invite — add to users table and mark accepted
    await serviceSupabase.from('users').upsert({
      id: user.id,
      client_id: invite.client_id,
      email: user.email,
      role: invite.role,
    })
    await serviceSupabase.from('team_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)

    redirect('/dashboard')
  }

  // Not logged in — show accept page with links to login/signup
  return (
    <CenterCard>
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Mail className="w-6 h-6 text-blue-600" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-1">You're invited!</h2>
      <p className="text-sm text-gray-500 mb-1">
        Join <strong>{client?.business_name ?? 'a team'}</strong> on RecMail as a <strong className="capitalize">{invite.role}</strong>.
      </p>
      <p className="text-xs text-gray-400 mb-6">Invite sent to: {invite.email}</p>

      <div className="space-y-3">
        <Link
          href={`/signup?invite=${token}&email=${encodeURIComponent(invite.email)}`}
          className="flex items-center justify-center w-full h-11 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Create account & join
        </Link>
        <Link
          href={`/login?invite=${token}`}
          className="flex items-center justify-center w-full h-11 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
        >
          I already have an account
        </Link>
      </div>
      <p className="text-[10px] text-gray-400 mt-4">This invite expires {new Date(invite.expires_at).toLocaleDateString()}</p>
    </CenterCard>
  )
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center">
        {children}
      </div>
    </div>
  )
}

function ErrorPage({ msg }: { msg: string }) {
  return (
    <CenterCard>
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
      <h2 className="text-base font-bold text-gray-900 mb-2">Invalid invite</h2>
      <p className="text-sm text-gray-500 mb-6">{msg}</p>
      <Link href="/login" className="text-sm font-medium text-[#1a73e8] hover:underline">Go to sign in</Link>
    </CenterCard>
  )
}
