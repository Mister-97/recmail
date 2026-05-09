import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { Mail, Inbox, CheckCircle2, XCircle, Kanban, BarChart2, Zap, Megaphone, Users, Settings } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import GlobalSearch from '@/components/GlobalSearch'
import SidebarItem from '@/components/SidebarItem'
import RevenueWidget from '@/components/RevenueWidget'
import WorkspaceMenu from '@/components/WorkspaceMenu'
import OnboardingBanner from '@/components/OnboardingBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const userRow = user ? (await supabase
    .from('users')
    .select('client_id, role, full_name, email')
    .eq('id', user.id)
    .single()).data : null

  const client = userRow?.client_id
    ? (await supabase.from('clients').select('id, business_name, twilio_number, stripe_account_id, gemini_prompt_override').eq('id', userRow.client_id).single()).data
    : null

  const displayName = userRow?.full_name || userRow?.email || 'Demo User'
  const businessName = client?.business_name || 'My Business'
  const bizInitials = businessName.slice(0, 2).toUpperCase()

  const MOCK_CONVERSATIONS = [
    { id: 'mock-1', customer_name: 'James Martinez',  customer_phone: '+18175550101', last_message: 'AC stopped working last night' },
    { id: 'mock-2', customer_name: 'Sarah Collins',   customer_phone: '+18175550182', last_message: 'Heating tune-up booked' },
    { id: 'mock-3', customer_name: null,               customer_phone: '+18175550247', last_message: 'Roof repair quote needed' },
    { id: 'mock-4', customer_name: 'David Kim',        customer_phone: '+18175550319', last_message: 'Plumbing repair complete' },
    { id: 'mock-5', customer_name: 'Maria Rodriguez',  customer_phone: '+18175550488', last_message: 'Emergency leak - water through ceiling' },
    { id: 'mock-6', customer_name: 'Carlos Rivera',    customer_phone: '+18175550561', last_message: 'AC tune-up scheduled' },
    { id: 'mock-7', customer_name: 'Linda Chen',       customer_phone: '+18175550634', last_message: 'Water heater replacement' },
    { id: 'mock-8', customer_name: 'Tony Reyes',       customer_phone: '+18175550532', last_message: 'HVAC replacement quote' },
    { id: 'mock-9', customer_name: 'Priya Sharma',     customer_phone: '+18175550709', last_message: 'Electrical panel upgrade' },
  ]

  const MOCK_QUALIFIED_COUNT = 3 // mock-2 + mock-6 + mock-7
  const qualifiedCount = client?.id
    ? ((await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('status', 'qualified')).count ?? 0)
    : MOCK_QUALIFIED_COUNT

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ─── Light Grey Sidebar ─── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#f3f4f6] border-r border-gray-200 overflow-y-auto">

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-800 tracking-tight">RecMail</span>
          </Link>
          <NotificationBell clientId={client?.id} />
        </div>

        {/* Global search */}
        <div className="px-2 pb-3">
          <GlobalSearch conversations={MOCK_CONVERSATIONS} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-1 pb-2">Inbox</p>
          <Suspense fallback={null}>
            <SidebarItem href="/dashboard" icon={<Inbox className="w-4 h-4" />} label="All Leads" />
            <SidebarItem href="/dashboard?status=qualified" icon={<CheckCircle2 className="w-4 h-4" />} label="Qualified" />
            <SidebarItem href="/dashboard?status=closed" icon={<XCircle className="w-4 h-4" />} label="Closed" />

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-2">Workspace</p>
            <SidebarItem href="/dashboard/pipeline" icon={<Kanban className="w-4 h-4" />} label="Pipeline" />
            <SidebarItem href="/dashboard/analytics" icon={<BarChart2 className="w-4 h-4" />} label="Analytics" />
            <SidebarItem href="/dashboard/automations" icon={<Zap className="w-4 h-4" />} label="Automations" />
            <SidebarItem href="/dashboard/campaigns" icon={<Megaphone className="w-4 h-4" />} label="Campaigns" />
            <SidebarItem href="/dashboard/customers" icon={<Users className="w-4 h-4" />} label="Customers" />
<SidebarItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
          </Suspense>
        </nav>

        {/* Revenue recovered */}
        <Suspense fallback={null}>
          <RevenueWidget clientId={client?.id} initialQualifiedCount={qualifiedCount} />
        </Suspense>

        {/* Workspace footer */}
        <WorkspaceMenu
          businessName={businessName}
          displayName={displayName}
          bizInitials={bizInitials}
        />
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f7f8fc] overflow-hidden">
        <Suspense fallback={null}><OnboardingBanner
          hasNumber={!!client?.twilio_number}
          hasStripe={!!client?.stripe_account_id}
          hasPrompt={!!client?.gemini_prompt_override}
        /></Suspense>
        {children}
      </main>

    </div>
  )
}

