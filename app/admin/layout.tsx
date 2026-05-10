import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, BarChart2, MessageSquare, ClipboardList, Search } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin status
  const { data: adminRow } = await serviceSupabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminRow) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-[#f7f8fc] overflow-hidden">
      <aside className="w-52 flex-shrink-0 flex flex-col bg-gray-900 pt-5 pb-4">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">RecMail</span>
          </div>
          <div className="mt-2 ml-9">
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Team Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 pt-1 pb-2">Operations</p>
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <BarChart2 className="w-4 h-4" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/feed" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">Live Feed</span>
          </Link>
          <Link href="/admin/onboarding" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <ClipboardList className="w-4 h-4" />
            <span className="font-medium">Onboarding</span>
          </Link>
          <Link href="/admin/search" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
            <Search className="w-4 h-4" />
            <span className="font-medium">Search</span>
          </Link>
        </nav>

        <div className="px-4 pt-4 border-t border-white/10">
          <p className="text-[10px] text-gray-500">Logged in as</p>
          <p className="text-xs font-semibold text-gray-300 truncate mt-0.5">{user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
