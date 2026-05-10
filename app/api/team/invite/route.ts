import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id, role').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client linked' }, { status: 403 })
  if (!['owner', 'admin'].includes(userRow.role)) return NextResponse.json({ error: 'Owner or admin only' }, { status: 403 })

  const { email, role = 'staff' } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Check if already a member
  const { data: existing } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('client_id', userRow.client_id)
    .eq('email', email.toLowerCase().trim())
    .single()
  if (existing) return NextResponse.json({ error: 'This person is already on your team.' }, { status: 409 })

  // Check for existing pending invite
  const { data: existingInvite } = await serviceSupabase
    .from('team_invites')
    .select('id')
    .eq('client_id', userRow.client_id)
    .eq('email', email.toLowerCase().trim())
    .is('accepted_at', null)
    .single()
  if (existingInvite) return NextResponse.json({ error: 'An invite is already pending for this email.' }, { status: 409 })

  const { data: invite, error } = await serviceSupabase
    .from('team_invites')
    .insert({
      client_id: userRow.client_id,
      email: email.toLowerCase().trim(),
      role,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invite.token}`

  // Send email via Resend if configured
  if (process.env.RESEND_API_KEY) {
    const { data: client } = await serviceSupabase
      .from('clients')
      .select('business_name')
      .eq('id', userRow.client_id)
      .single()

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'RecMail <noreply@recmail.io>',
        to: email,
        subject: `You've been invited to join ${client?.business_name ?? 'a team'} on RecMail`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="font-size:20px;font-weight:700;color:#111;margin-bottom:8px">You're invited to RecMail</h2>
            <p style="color:#555;font-size:14px;margin-bottom:24px">
              You've been invited to join <strong>${client?.business_name ?? 'a business'}</strong> as a <strong>${role}</strong>.
              Click below to accept and set up your account.
            </p>
            <a href="${inviteUrl}" style="display:inline-block;background:#1a73e8;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none">
              Accept Invite
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:24px">This link expires in 7 days.</p>
          </div>
        `,
      })
    } catch { /* email failure is non-critical */ }
  }

  return NextResponse.json({ ok: true, invite_url: inviteUrl })
}
