import { NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const { data: clients } = await serviceSupabase
      .from('clients')
      .select('id, business_name, plan')

    if (!clients?.length) return NextResponse.json({ ok: true, sent: 0 })

    let sent = 0
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    for (const client of clients) {
      // Get owner email
      const { data: owner } = await serviceSupabase
        .from('users')
        .select('email, full_name')
        .eq('client_id', client.id)
        .eq('role', 'owner')
        .single()

      if (!owner?.email) continue

      // Conversations created this month
      const { count: totalLeads } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString())

      // Won leads this month
      const { count: wonLeads } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('stage', 'won')
        .gte('updated_at', monthStart.toISOString())
        .lt('updated_at', monthEnd.toISOString())

      // Qualified leads
      const { count: qualifiedLeads } = await serviceSupabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'qualified')
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString())

      const wonCount = wonLeads ?? 0
      const totalCount = totalLeads ?? 0
      const qualCount = qualifiedLeads ?? 0

      // Estimated revenue: use $350 avg job value as baseline
      const AVG_JOB_VALUE = 350
      const estimatedRevenue = wonCount * AVG_JOB_VALUE

      const planCost = client.plan === 'starter' ? 49 : client.plan === 'growth' ? 99 : 199
      const roi = planCost > 0 ? Math.round((estimatedRevenue / planCost) * 10) / 10 : 0

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7f8fc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .header { background: linear-gradient(135deg, #1d4ed8, #4f46e5); padding: 40px 40px 32px; color: white; }
  .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
  .header p { margin: 0; font-size: 14px; opacity: 0.8; }
  .body { padding: 32px 40px; }
  .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat { background: #f7f8fc; border-radius: 12px; padding: 20px; }
  .stat .value { font-size: 28px; font-weight: 800; color: #111827; }
  .stat .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .roi-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #6ee7b7; border-radius: 12px; padding: 24px; margin-bottom: 28px; text-align: center; }
  .roi-box .roi-value { font-size: 42px; font-weight: 900; color: #059669; }
  .roi-box .roi-label { font-size: 13px; color: #047857; margin-top: 4px; }
  .footer { background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; }
  .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Monthly ROI Report</h1>
    <p>${client.business_name} · ${monthName}</p>
  </div>
  <div class="body">
    <div class="roi-box">
      <div class="roi-value">${roi}x ROI</div>
      <div class="roi-label">return on your $${planCost}/mo RecMail subscription</div>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="value">${totalCount}</div>
        <div class="label">Missed calls recovered</div>
      </div>
      <div class="stat">
        <div class="value">${qualCount}</div>
        <div class="label">Leads qualified by AI</div>
      </div>
      <div class="stat">
        <div class="value">${wonCount}</div>
        <div class="label">Jobs won</div>
      </div>
      <div class="stat">
        <div class="value">$${estimatedRevenue.toLocaleString()}</div>
        <div class="label">Est. revenue recovered</div>
      </div>
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;">
      Without RecMail, these ${totalCount} missed calls would have likely gone to a competitor.
      At an average job value of $${AVG_JOB_VALUE}, recovering even a fraction of these leads makes RecMail
      one of the highest-ROI tools in your business.
    </p>
  </div>
  <div class="footer">
    <p>RecMail · Automated missed-call recovery · You're on the ${client.plan} plan</p>
    <p style="margin-top:4px;">Questions? Reply to this email.</p>
  </div>
</div>
</body>
</html>`

      await resend.emails.send({
        from: 'RecMail <reports@recmail.io>',
        to: owner.email,
        subject: `Your ${monthName} ROI Report — ${client.business_name}`,
        html,
      })

      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('Monthly ROI cron error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
