'use client'

import { useState } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
  onSuccess: () => void
  title?: string
  subtitle?: string
}

export default function AuthModal({ onClose, onSuccess, title = 'Welcome to Gospello', subtitle }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message); setLoading(false); return }
      onSuccess()
    } else {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name.trim(),
            account_type: 'organizer',
          },
        },
      })
      if (err) { setError(err.message); setLoading(false); return }
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setMode('signin'); setError('') }}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
              mode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
              mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
