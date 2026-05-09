'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ChevronDown, Settings, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceMenuProps {
  businessName: string
  displayName: string
  bizInitials: string
}

export default function WorkspaceMenu({ businessName, displayName, bizInitials }: WorkspaceMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={ref} className="relative px-2 pb-4 pt-2 border-t border-gray-200">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-200/60 cursor-pointer transition-colors group"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[10px] font-bold text-white">{bizInitials}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-gray-700 truncate leading-tight">{businessName}</p>
          <p className="text-[10px] text-gray-400 truncate">{displayName}</p>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-all flex-shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
          <div className="px-3 py-2 border-b border-gray-50 mb-1">
            <p className="text-xs font-semibold text-gray-800 truncate">{businessName}</p>
            <p className="text-[10px] text-gray-400 truncate">{displayName}</p>
          </div>
          <button
            onClick={() => { setOpen(false); router.push('/dashboard/settings') }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            Settings
          </button>
          <button
            onClick={() => { setOpen(false); router.push('/dashboard/settings?tab=billing') }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-gray-400" />
            Account
          </button>
          <div className="border-t border-gray-50 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
