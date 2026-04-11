'use client'

import { useState, useTransition } from 'react'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { adminLogin } from './actions'

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError('')

    startTransition(async () => {
      const result = await adminLogin(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Full page reload so cookies are fully written before server reads them
        window.location.href = '/admin'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-400 mt-1 text-sm">Gospello Admin Panel</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/30 text-red-400 text-sm px-4 py-3 rounded-lg border border-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@gospello.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Not an admin?{' '}
            <a href="/auth/login" className="text-gray-400 hover:text-gray-300">
              Go to regular sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
