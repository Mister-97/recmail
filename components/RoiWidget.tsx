'use client'

import { TrendingUp, Users, DollarSign, Award } from 'lucide-react'

interface RoiWidgetProps {
  conversationsStarted?: number
  qualifiedLeads?: number
  avgJobValue?: number
  className?: string
}

export default function RoiWidget({
  conversationsStarted = 47,
  qualifiedLeads = 12,
  avgJobValue = 350,
  className = '',
}: RoiWidgetProps) {
  const estimatedRevenue = qualifiedLeads * avgJobValue
  const recoveryRate = conversationsStarted > 0
    ? Math.round((qualifiedLeads / conversationsStarted) * 100)
    : 0

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-black mt-0.5">
            ${estimatedRevenue.toLocaleString()}
            <span className="text-sm font-semibold text-blue-300 ml-1">est. recovered</span>
          </p>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-200" />
            <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Engaged</p>
          </div>
          <p className="text-xl font-black">{conversationsStarted}</p>
          <p className="text-blue-300 text-[10px] mt-0.5">conversations</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-blue-200" />
            <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Qualified</p>
          </div>
          <p className="text-xl font-black">{qualifiedLeads}</p>
          <p className="text-blue-300 text-[10px] mt-0.5">hot leads</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-200" />
            <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Rate</p>
          </div>
          <p className="text-xl font-black">{recoveryRate}%</p>
          <p className="text-blue-300 text-[10px] mt-0.5">recovery</p>
        </div>
      </div>

      <p className="text-blue-300 text-[10px] mt-3 text-center">
        Based on {qualifiedLeads} qualified leads × ${avgJobValue} avg job value
      </p>
    </div>
  )
}
