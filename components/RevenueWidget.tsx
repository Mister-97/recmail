'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AVG_TICKET = 550 // default avg job value in dollars

function formatRevenue(n: number) {
  return `$${n.toLocaleString()}`
}

export default function RevenueWidget({
  clientId,
  initialQualifiedCount,
}: {
  clientId: string | undefined
  initialQualifiedCount: number
}) {
  const [count, setCount] = useState(initialQualifiedCount)
  const supabase = createClient()

  useEffect(() => {
    if (!clientId || clientId === 'mock-client') return

    const channel = supabase
      .channel('revenue-widget')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `client_id=eq.${clientId}`,
        },
        async () => {
          const { count: newCount } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'qualified')
          setCount(newCount ?? 0)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId, supabase])

  const revenue = count * AVG_TICKET

  return (
    <div className="mx-2 mb-3 bg-white border border-emerald-100 rounded-xl px-3 py-2 shadow-sm flex items-center justify-between gap-2">
      <div>
        <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest leading-none mb-1">This month</p>
        <p className="text-sm font-bold text-emerald-600 tabular-nums transition-all duration-500 leading-none">
          {formatRevenue(revenue)}
        </p>
      </div>
      <p className="text-[10px] text-gray-400 leading-tight text-right">revenue<br/>recovered</p>
    </div>
  )
}
