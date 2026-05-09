'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function SidebarItem({
  href,
  icon,
  label,
  count,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status')
  const currentFull = currentStatus ? `${pathname}?status=${currentStatus}` : pathname

  // Pages that are NOT inbox (should not highlight "All Leads")
  const isWorkspacePage = ['/pipeline', '/analytics', '/automations', '/campaigns', '/customers', '/settings']
    .some(p => pathname.startsWith(`/dashboard${p}`))

  const isActive =
    (href === '/dashboard' && !currentStatus && !isWorkspacePage) ||
    (href.includes('?status=') && href === currentFull) ||
    (!href.includes('?') && href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all',
        isActive
          ? 'bg-white text-blue-600 shadow-sm border border-gray-200/80'
          : 'text-gray-500 hover:bg-gray-200/70 hover:text-gray-800'
      )}
    >
      <span className={isActive ? 'text-blue-500' : 'text-gray-400'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count != null && count > 0 ? (
        <span className={cn(
          'text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none',
          isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
        )}>{count}</span>
      ) : null}
    </Link>
  )
}
