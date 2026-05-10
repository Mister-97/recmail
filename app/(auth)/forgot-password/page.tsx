'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-[#1a73e8] rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-semibold text-[#202124]">RecMail</span>
        </div>
        <p className="text-sm text-gray-500">Reset your password</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
            </p>
            <Link href="/login" className="text-sm font-medium text-[#1a73e8] hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">Enter your email and we'll send you a link to reset your password.</p>
              <label className="block text-sm font-medium text-[#202124] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>

      {!sent && (
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-[#1a73e8] hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </p>
      )}
    </div>
  )
}
