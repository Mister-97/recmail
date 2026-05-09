'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, Phone, MessageSquare, DollarSign, Star, Tag, Clock, User, TrendingUp, CheckCircle2, MapPin, Pencil, X, Check, ArrowUpDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type ServiceRecord = {
  date: string
  service: string
  stage: string
  spend?: number
}

type CustomerProfile = {
  id: string
  phone: string
  name: string | null
  address: string
  first_contact: string
  last_contact: string
  total_conversations: number
  total_spend: number
  won_count: number
  source: string | null
  tags: string[]
  history: ServiceRecord[]
  notes: string
}

const MOCK_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-1',
    phone: '+18175550101',
    name: 'David Martinez',
    address: '2847 Elmwood Dr, Fort Worth, TX 76109',
    first_contact: new Date(Date.now() - 1000*60*60*24*180).toISOString(),
    last_contact: new Date(Date.now() - 1000*60*60*24*3).toISOString(),
    total_conversations: 4,
    total_spend: 1840,
    won_count: 3,
    source: 'google',
    tags: ['hvac', 'returning'],
    history: [
      { date: new Date(Date.now() - 1000*60*60*24*180).toISOString(), service: 'AC repair', stage: 'won', spend: 420 },
      { date: new Date(Date.now() - 1000*60*60*24*90).toISOString(), service: 'Furnace tune-up', stage: 'won', spend: 180 },
      { date: new Date(Date.now() - 1000*60*60*24*45).toISOString(), service: 'Full AC replacement', stage: 'won', spend: 1240 },
      { date: new Date(Date.now() - 1000*60*60*24*3).toISOString(), service: 'Filter replacement', stage: 'open' },
    ],
    notes: 'Prefers morning appointments. Has a 2-story home. Very prompt payer.',
  },
  {
    id: 'cust-2',
    phone: '+18175550202',
    name: 'Sarah Johnson',
    address: '519 Ridgecrest Ln, Arlington, TX 76012',
    first_contact: new Date(Date.now() - 1000*60*60*24*60).toISOString(),
    last_contact: new Date(Date.now() - 1000*60*60*24*10).toISOString(),
    total_conversations: 2,
    total_spend: 650,
    won_count: 1,
    source: 'yelp',
    tags: ['plumbing'],
    history: [
      { date: new Date(Date.now() - 1000*60*60*24*60).toISOString(), service: 'Leak repair', stage: 'won', spend: 650 },
      { date: new Date(Date.now() - 1000*60*60*24*10).toISOString(), service: 'Drain cleaning quote', stage: 'qualified' },
    ],
    notes: '',
  },
  {
    id: 'cust-3',
    phone: '+18175550303',
    name: null,
    address: '',
    first_contact: new Date(Date.now() - 1000*60*60*24*14).toISOString(),
    last_contact: new Date(Date.now() - 1000*60*60*24*14).toISOString(),
    total_conversations: 1,
    total_spend: 0,
    won_count: 0,
    source: 'referral',
    tags: ['roofing'],
    history: [
      { date: new Date(Date.now() - 1000*60*60*24*14).toISOString(), service: 'Roof inspection inquiry', stage: 'open' },
    ],
    notes: '',
  },
  {
    id: 'cust-4',
    phone: '+18175550404',
    name: 'Carlos Rivera',
    address: '1102 Sunset Blvd, Fort Worth, TX 76104',
    first_contact: new Date(Date.now() - 1000*60*60*24*365).toISOString(),
    last_contact: new Date(Date.now() - 1000*60*60*24*30).toISOString(),
    total_conversations: 6,
    total_spend: 4200,
    won_count: 5,
    source: 'google',
    tags: ['hvac', 'vip', 'returning'],
    history: [
      { date: new Date(Date.now() - 1000*60*60*24*365).toISOString(), service: 'AC install', stage: 'won', spend: 2800 },
      { date: new Date(Date.now() - 1000*60*60*24*300).toISOString(), service: 'Duct cleaning', stage: 'won', spend: 350 },
      { date: new Date(Date.now() - 1000*60*60*24*200).toISOString(), service: 'Thermostat upgrade', stage: 'won', spend: 220 },
      { date: new Date(Date.now() - 1000*60*60*24*120).toISOString(), service: 'Maintenance plan', stage: 'won', spend: 480 },
      { date: new Date(Date.now() - 1000*60*60*24*60).toISOString(), service: 'Emergency AC repair', stage: 'won', spend: 350 },
      { date: new Date(Date.now() - 1000*60*60*24*30).toISOString(), service: 'Annual tune-up', stage: 'won', spend: 0 },
    ],
    notes: 'VIP customer. Refer to owner for any complaints. Has annual maintenance contract.',
  },
  {
    id: 'cust-5',
    phone: '+18175550505',
    name: 'Linda Chen',
    address: '388 Maple Creek Rd, Keller, TX 76248',
    first_contact: new Date(Date.now() - 1000*60*60*24*22).toISOString(),
    last_contact: new Date(Date.now() - 1000*60*60*24*1).toISOString(),
    total_conversations: 2,
    total_spend: 890,
    won_count: 1,
    source: 'nextdoor',
    tags: ['plumbing', 'returning'],
    history: [
      { date: new Date(Date.now() - 1000*60*60*24*22).toISOString(), service: 'Water heater replacement', stage: 'won', spend: 890 },
      { date: new Date(Date.now() - 1000*60*60*24*1).toISOString(), service: 'Annual inspection', stage: 'qualified' },
    ],
    notes: 'Found us on Nextdoor. Very responsive over text.',
  },
]

const SOURCE_COLORS: Record<string, string> = {
  google:   'bg-blue-50 text-blue-700',
  yelp:     'bg-red-50 text-red-700',
  facebook: 'bg-indigo-50 text-indigo-700',
  referral: 'bg-emerald-50 text-emerald-700',
  nextdoor: 'bg-orange-50 text-orange-700',
}

const STAGE_COLORS: Record<string, string> = {
  won:       'bg-emerald-100 text-emerald-700',
  open:      'bg-blue-100 text-blue-700',
  qualified: 'bg-violet-100 text-violet-700',
  lost:      'bg-red-100 text-red-700',
  closed:    'bg-gray-100 text-gray-500',
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  return phone
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d/30)}mo ago`
  return `${Math.floor(d/365)}y ago`
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'spend' | 'last_contact' | 'jobs'>('last_contact')
  const [selectedId, setSelectedId] = useState<string>('cust-4')
  const [editingNote, setEditingNote] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(MOCK_CUSTOMERS.map(c => [c.id, c.notes]))
  )
  const [contacts, setContacts] = useState<Record<string, { name: string; phone: string; address: string }>>(
    Object.fromEntries(MOCK_CUSTOMERS.map(c => [c.id, { name: c.name || '', phone: c.phone, address: c.address }]))
  )
  const [editDraft, setEditDraft] = useState({ name: '', phone: '', address: '' })

  const allTags = Array.from(new Set(MOCK_CUSTOMERS.flatMap(c => c.tags.filter(t => t !== 'returning'))))

  const filtered = MOCK_CUSTOMERS
    .filter(c => {
      const q = search.toLowerCase()
      const matchesSearch = c.phone.includes(q) || (c.name || '').toLowerCase().includes(q) || c.tags.some(t => t.includes(q))
      const matchesTag = !filterTag || c.tags.includes(filterTag)
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      if (sortBy === 'spend') return b.total_spend - a.total_spend
      if (sortBy === 'jobs') return b.won_count - a.won_count
      return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
    })

  const selected = MOCK_CUSTOMERS.find(c => c.id === selectedId) ?? null

  const totalSpend = MOCK_CUSTOMERS.reduce((s, c) => s + c.total_spend, 0)
  const returningCount = MOCK_CUSTOMERS.filter(c => c.total_conversations > 1).length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f7f8fc]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-bold text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Full history, spend, and notes for every contact</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">${totalSpend.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">total revenue</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{returningCount}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">returning</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{MOCK_CUSTOMERS.length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">total contacts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: customer list */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
          {/* Search + filters */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, phone, or tag…"
                className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                {allTags.map(tag => (
                  <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize transition-all',
                      filterTag === tag ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    )}>
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="text-[10px] font-semibold text-gray-500 bg-transparent border-none outline-none cursor-pointer">
                  <option value="last_contact">Recent</option>
                  <option value="spend">Top spend</option>
                  <option value="jobs">Most jobs</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(customer => {
              const isSelected = selectedId === customer.id
              const displayName = customer.name || formatPhone(customer.phone)
              const initials = (customer.name || formatPhone(customer.phone)).slice(0, 2).toUpperCase()
              const isVip = customer.tags.includes('vip')

              return (
                <button
                  key={customer.id}
                  onClick={() => { setSelectedId(customer.id); setEditingNote(false) }}
                  className={cn(
                    'w-full flex items-center gap-3.5 px-4 py-3.5 border-b border-gray-100 text-left transition-colors',
                    isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm',
                    isVip ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  )}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[13px] font-semibold truncate', isSelected ? 'text-blue-700' : 'text-gray-900')}>{displayName}</span>
                      {isVip && <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{formatPhone(customer.phone)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[11px] text-gray-400">{timeAgo(customer.last_contact)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-xs font-bold', customer.total_spend > 0 ? 'text-emerald-600' : 'text-gray-300')}>
                      {customer.total_spend > 0 ? `$${customer.total_spend.toLocaleString()}` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-400">{customer.won_count} won</p>
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <User className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No customers found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selected ? (
          <div className="w-[360px] flex-shrink-0 bg-white overflow-y-auto flex flex-col">
            {/* Profile header */}
            {(() => {
              const isVip = selected.tags.includes('vip')
              const contact = contacts[selected.id]
              const displayName = contact.name || formatPhone(contact.phone)
              const initials = (contact.name || formatPhone(contact.phone)).slice(0, 2).toUpperCase()
              return (
                <div className={cn('p-5 border-b border-gray-100', isVip ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-blue-50 to-indigo-50')}>
                  {editingContact ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-700">Edit Contact</p>
                        <button onClick={() => setEditingContact(false)} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Name</label>
                        <input value={editDraft.name} onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                          placeholder="Full name"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Phone</label>
                        <input value={editDraft.phone} onChange={e => setEditDraft(d => ({ ...d, phone: e.target.value }))}
                          placeholder="+1 (817) 555-0000"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 block mb-1">Service address</label>
                        <input value={editDraft.address} onChange={e => setEditDraft(d => ({ ...d, address: e.target.value }))}
                          placeholder="123 Main St, City, TX 00000"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => { setContacts(c => ({ ...c, [selected.id]: editDraft })); setEditingContact(false) }}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-gray-900 text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button onClick={() => setEditingContact(false)} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-md',
                          isVip ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        )}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-gray-900 truncate">{displayName}</p>
                            {isVip && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                <Star className="w-2.5 h-2.5" /> VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{formatPhone(contact.phone)}</p>
                          </div>
                          {contact.address && (
                            <div className="flex items-start gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-gray-500 leading-snug">{contact.address}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setEditDraft({ name: contact.name, phone: contact.phone, address: contact.address }); setEditingContact(true) }}
                          className="p-2 rounded-xl hover:bg-black/5 transition-colors flex-shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>

                      {/* Tags + source */}
                      <div className="flex flex-wrap gap-1.5">
                        {selected.source && (
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', SOURCE_COLORS[selected.source] || 'bg-gray-100 text-gray-500')}>
                            {selected.source}
                          </span>
                        )}
                        {selected.tags.filter(t => t !== 'vip' && t !== 'returning').map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/70 text-gray-500 px-2 py-0.5 rounded-full capitalize border border-gray-200">
                            <Tag className="w-2.5 h-2.5" /> {tag}
                          </span>
                        ))}
                        {selected.tags.includes('returning') && (
                          <span className="text-[10px] font-semibold bg-white/70 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                            Returning
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
              {[
                { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />, label: 'Revenue', value: `$${selected.total_spend.toLocaleString()}` },
                { icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />, label: 'Jobs won', value: selected.won_count },
                { icon: <MessageSquare className="w-3.5 h-3.5 text-violet-500" />, label: 'Convos', value: selected.total_conversations },
              ].map((stat, i) => (
                <div key={stat.label} className={cn('px-4 py-3.5 text-center', i < 2 && 'border-r border-gray-100')}>
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="text-[15px] font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="p-4 space-y-5 flex-1">
              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Service History</p>
                <div className="relative">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-100" />
                  <div className="space-y-3">
                    {selected.history.map((record, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className={cn(
                          'w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white',
                          record.stage === 'won' ? 'bg-emerald-400' : record.stage === 'open' ? 'bg-blue-400' : record.stage === 'qualified' ? 'bg-violet-400' : 'bg-gray-300'
                        )} />
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">{record.service}</p>
                            {record.spend ? <span className="text-[11px] font-bold text-emerald-600 flex-shrink-0">${record.spend.toLocaleString()}</span> : null}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize', STAGE_COLORS[record.stage] || 'bg-gray-100 text-gray-500')}>{record.stage}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</p>
                  {!editingNote && (
                    <button onClick={() => setEditingNote(true)} className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                      {notes[selected.id] ? 'Edit' : 'Add'}
                    </button>
                  )}
                </div>
                {editingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes[selected.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [selected.id]: e.target.value }))}
                      rows={3} autoFocus
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      placeholder="Add notes about this customer…"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingNote(false)} className="text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">Save</button>
                      <button onClick={() => setEditingNote(false)} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingNote(true)} className="w-full text-left text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 hover:bg-gray-100 transition-colors min-h-[44px] border border-gray-100">
                    {notes[selected.id] || <span className="text-gray-300 italic">Click to add notes…</span>}
                  </button>
                )}
              </div>

              {/* Quick stats footer */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: <Clock className="w-3 h-3 text-gray-400" />, label: 'First contact', value: timeAgo(selected.first_contact) },
                  { icon: <TrendingUp className="w-3 h-3 text-gray-400" />, label: 'Last contact', value: timeAgo(selected.last_contact) },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                    {s.icon}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-700">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/dashboard?search=${encodeURIComponent(contacts[selected.id]?.phone || selected.phone)}`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> View Conversation
                </Link>
                <a
                  href={`sms:${contacts[selected.id]?.phone || selected.phone}`}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-[360px] flex-shrink-0 bg-white flex items-center justify-center">
            <div className="text-center">
              <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Select a customer</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
