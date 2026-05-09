import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

export async function GET() {
  try {
    const { data: clients } = await serviceSupabase
      .from('clients')
      .select('id, business_name, twilio_number, owner_id')

    if (!clients?.length) return NextResponse.json({ ok: true, sent: 0 })

    let sent = 0

    for (const client of clients) {
      // Get owner phone from users table
      const { data: owner } = await serviceSupabase
        .from('users')
        .select('phone')
        .eq('id', client.owner_id)
        .single()

      if (!owner?.phone) continue

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Count open leads
      const { count: openCount } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'open')

      // Count qualified leads
      const { count: qualifiedCount } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'qualified')

      // Count today's appointments (conversations with stage = booked and scheduled today)
      const { count: todayBookings } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('stage', 'booked')
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', new Date(today.getTime() + 86400000).toISOString())

      // Overdue follow-ups (open conversations with last message > 48h ago)
      const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      const { count: overdueCount } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'open')
        .lt('updated_at', cutoff)

      const lines: string[] = [
        `Good morning! Here is your RecMail brief for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`,
        `Open leads: ${openCount ?? 0}`,
        `Qualified leads ready to book: ${qualifiedCount ?? 0}`,
        `Appointments today: ${todayBookings ?? 0}`,
      ]

      if ((overdueCount ?? 0) > 0) {
        lines.push(`Overdue follow-ups: ${overdueCount}. These leads have not heard from you in 48+ hours.`)
      }

      lines.push('Reply to this number to check your RecMail dashboard.')

      const body = lines.join('\n')
      await sendSms(owner.phone, client.twilio_number, body)
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Morning brief cron error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
